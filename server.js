const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;
const cors = require("cors");
app.use(cors());
require("dotenv").config();

app.use(express.json()); // ✅ Middleware to parse JSON requests

const SECRET_KEY = process.env.SECRET_KEY;
 // Replace with a strong secret key

// ✅ AWS S3 (for presigned uploads)
let S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, getSignedUrl;
try {
    ({ S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3"));
    ({ getSignedUrl } = require("@aws-sdk/s3-request-presigner"));
} catch (e) {
    // Modules may not be installed locally; endpoint will check before using
}
const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION || "eu-north-1";
const USE_S3 = (process.env.USE_S3 || "false").toLowerCase() === "true";
const ASSET_CACHE_CONTROL = process.env.ASSET_CACHE_CONTROL || "public, max-age=31536000, immutable";
let s3 = null;
if (USE_S3 && S3Client) {
    s3 = new S3Client({ region: S3_REGION });
}
console.log(`[Startup] USE_S3=${USE_S3} | S3_BUCKET=${S3_BUCKET ? 'set' : 'missing'} | REGION=${S3_REGION}`);

// ✅ MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "00000", // Replace with your MySQL password
    database: process.env.DB_NAME || "agrilink",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Connected to MySQL database!");
    }
});

// ✅ Test API
app.get("/", (req, res) => {
    res.send("API is running...");
});

// ✅ User Signup
app.post("/signup", async (req, res) => {
    const { name, email, password, phone, address, role } = req.body;
  
    if (!name || !email || !password || !phone || !address || !role) {
      return res.status(400).json({ error: "All fields are required!" });
    }
  
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ error: "Database error!" });
  
      if (results.length > 0) {
        return res.status(400).json({ error: "Email already registered!" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert into users table
      db.query(
        "INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)",
        [name, email, hashedPassword, phone, address, role],
        (err, userResult) => {
          if (err) return res.status(500).json({ error: "Failed to register user!" });
          
          // If the role is 'farmer', also insert into the farmers table.
                    if (role === "farmer") {
                        // Insert farmer profile linked to the created user via user_id
                        db.query(
                            "INSERT INTO farmers (name, email, phone, user_id) VALUES (?, ?, ?, ?)",
                            [name, email, phone, userResult.insertId],
                            (err, farmerResult) => {
                                if (err) {
                                    console.error("Error inserting into farmers:", err);
                                    return res.status(500).json({ error: "Failed to register farmer!" });
                                }
                                res.status(201).json({ message: "User and farmer registered successfully!", farmer_id: farmerResult.insertId });
                            }
                        );
                    } else {
            res.status(201).json({ message: "User registered successfully!" });
          }
        }
      );
    });
  });
  
// ✅ User Login
app.post("/login", (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: "Email and Password are required!" });
    }
  
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ error: err });
      if (results.length === 0) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      const user = results[0];
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials!" });
      }
  
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        SECRET_KEY,
        { expiresIn: "1h" }
      );
      //localStorage.setItem("token", response.data.token);
      const farmerId = user.role === "farmer" ? user.id : null;

      // Send token and farmer_id (or user.id) along with the login success message
      res.json({
        message: "Login successful!",
        token,
        farmer_id: farmerId, // Send farmer_id (or user.id) if relevant
        role: user.role, // Optionally include user role if required
      });
    });
  });
  
// ✅ Middleware to Verify JWT Token
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Access denied! No token provided." });

    try {
        const verified = jwt.verify(token.replace("Bearer ", ""), SECRET_KEY);
        req.user = verified;
        console.log("Decoded user:", verified);

        next();
    } catch (err) {
        res.status(403).json({ message: "Invalid or expired token!" });
    }
};
app.get("/orders", authenticateToken, (req, res) => {
    const user_id = req.user.id;

    // First, fetch all orders for the user
    db.query("SELECT * FROM orders WHERE user_id = ?", [user_id], (err, orders) => {
        if (err) return res.status(500).json({ error: err });

        if (orders.length === 0) {
            return res.json([]); // No orders found
        }

        // Fetch products for each order
        const orderDetails = [];

        let completedRequests = 0;
        orders.forEach((order, index) => {
            db.query("SELECT p.id, p.name, oi.quantity, oi.price FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?", 
            [order.id], 
            (err, products) => {
                if (err) return res.status(500).json({ error: err });

                orderDetails.push({
                    id: order.id,
                    total_price: order.total_price,
                    status: order.status,
                    created_at: order.created_at,
                    products: products, // Attach products to each order
                });

                completedRequests++;
                if (completedRequests === orders.length) {
                    res.json(orderDetails); // Send final response after all orders are processed
                }
            });
        });
    });
});
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Only create local uploads directory when not using S3
if (!USE_S3) {
    const uploadsDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
}

// Configure multer for file storage (used only when USE_S3=false)
const storage = multer.diskStorage({
    destination: "uploads/", // Images will be saved in 'uploads' folder
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});
const upload = multer({ storage });
// Conditionally apply multer; skip when using S3 so we don't save local files
const productsUploadMiddleware = USE_S3 ? (req, res, next) => next() : upload.single("image");

app.post("/products", authenticateToken, productsUploadMiddleware, (req, res) => {
    console.log("Incoming request:", req.body);
    if (req.file) console.log("Uploaded file:", req.file);
    console.log("User Role:", req.user.role);

    if (req.user.role !== "admin" && req.user.role !== "farmer") {
        return res.status(403).json({ message: "Access denied! Admin or Farmer only." });
    }

    // When S3 uploads are enabled, do not accept direct multipart uploads.
    // Enforce client to upload to S3 first and send image_key only.
    if (USE_S3) {
        const key = (req.body && typeof req.body.image_key === "string") ? req.body.image_key.trim() : "";
        if (!key) {
            // Clean up any temp file saved by multer to avoid orphan files
            try { if (req.file && req.file.path) require("fs").unlinkSync(req.file.path); } catch (e) {}
            return res.status(400).json({
                message: "Image must be uploaded to S3 first. Please select an image, wait for upload to finish, then submit.",
            });
        }
    }

    const { farmer_id: farmerIdFromBody, name, description, price, quantity, category } = req.body;
    // Prefer image_key (S3 object key), then explicit image_url (S3/CDN URL), else fallback to uploaded file path
    let image_url = null;
    if (req.body && typeof req.body.image_key === "string" && req.body.image_key.trim() !== "") {
        image_url = req.body.image_key.trim();
    } else if (req.body && typeof req.body.image_url === "string" && req.body.image_url.trim() !== "") {
        image_url = req.body.image_url.trim();
    } else if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }

    if (!name || !price || !quantity) {
        return res.status(400).json({ message: "Name, price, and quantity are required!" });
    }
    console.log("Image URL:", image_url);

    // Resolve farmer_id based on role
    const useInsert = (resolvedFarmerId) => {
        db.query(
            "INSERT INTO products (farmer_id, name, description, price, quantity, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [resolvedFarmerId, name, description, price, quantity, category, image_url],
            (err, result) => {
                if (err) {
                    console.error("Database Error:", err);
                    return res.status(500).json({ error: "Database error while adding product" });
                }
                res.status(201).json({ message: "Product added successfully!", image_url });
            }
        );
    };

    if (req.user.role === "admin") {
        // Admin can specify farmer_id explicitly; if not provided, reject
        const parsed = farmerIdFromBody ? Number(farmerIdFromBody) : NaN;
        if (!parsed || Number.isNaN(parsed)) {
            return res.status(400).json({ message: "farmer_id is required when adding a product as admin" });
        }
        return useInsert(parsed);
    }

    // For farmer role: map user -> farmers.id
    const farmerUserId = req.user.id;
    db.query(
        "SELECT id FROM farmers WHERE user_id = ? LIMIT 1",
        [farmerUserId],
        (err, rows) => {
            if (err) {
                // Fallback if 'user_id' column is missing in farmers table
                if (err.code === 'ER_BAD_FIELD_ERROR') {
                    console.warn("farmers.user_id missing; falling back to email join");
                    const email = req.user.email;
                    return db.query(
                        "SELECT id FROM farmers WHERE email = ? LIMIT 1",
                        [email],
                        (err2, rows2) => {
                            if (err2) {
                                console.error("Farmer lookup fallback error:", err2);
                                return res.status(500).json({ message: "Failed to resolve farmer profile" });
                            }
                            if (!rows2 || rows2.length === 0) {
                                return res.status(400).json({ message: "Farmer profile not found for this user" });
                            }
                            const resolvedId = rows2[0].id;
                            console.log("Resolved farmer_id (fallback):", resolvedId);
                            return useInsert(resolvedId);
                        }
                    );
                }
                console.error("Farmer lookup error:", err);
                return res.status(500).json({ message: "Failed to resolve farmer profile" });
            }
            if (!rows || rows.length === 0) {
                return res.status(400).json({ message: "Farmer profile not found for this user" });
            }
            const resolvedId = rows[0].id;
            console.log("Resolved farmer_id:", resolvedId);
            useInsert(resolvedId);
        }
    );
});


// ✅ Serve uploaded images
// Temporary proxy: If USE_S3 is enabled, try fetching from S3 first; otherwise fall back to local static files
const s3UploadsProxy = async (req, res, next) => {
    try {
        if (!USE_S3 || !s3 || !GetObjectCommand) {
            return next();
        }
        // Normalize key from path: '/uploads/foo.jpg' -> 'uploads/foo.jpg'
        // Support a few cases:
        // 1) Regex route with capture: req.params[0]
        // 2) Named repeating param: req.params.path (string or array)
        // 3) Fallback: derive from req.path
        let remainder;
        if (req.params) {
            if (req.params[0]) {
                remainder = String(req.params[0]);
            } else if (Array.isArray(req.params.path)) {
                remainder = req.params.path.join("/");
            } else if (req.params.path) {
                remainder = String(req.params.path);
            }
        }
        if (!remainder) {
            remainder = req.path.replace(/^\/+/, "").replace(/^uploads\/?/, "");
        }
        // Primary key attempts:
        // 1) uploads/<remainder>
        // 2) <remainder> (fallback for legacy objects uploaded at bucket root)
        const primaryKey = `uploads/${remainder}`;
        const fallbackKey = remainder; // legacy root placement
        const keysToTry = [];
        if (primaryKey.startsWith("uploads/") && primaryKey !== 'uploads/') keysToTry.push(primaryKey);
        if (fallbackKey && fallbackKey !== primaryKey) keysToTry.push(fallbackKey);
        if (keysToTry.length === 0) return next();

        // For HEAD requests, fetch only headers — try keys in order
        if (req.method === 'HEAD' && HeadObjectCommand) {
            let head = null;
            let usedKey = null;
            for (const k of keysToTry) {
                try {
                    head = await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: k }));
                    usedKey = k; break;
                } catch (e) {
                    if (e && (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404)) continue;
                    // Non-404: break and return 404 to avoid leaking errors
                    throw e;
                }
            }
            if (!head) return next();
            res.set("X-Source", "s3-proxy");
            res.set("X-Source-Key", usedKey);
            if (head.ContentType) res.set("Content-Type", head.ContentType);
            res.set("Cache-Control", head.CacheControl || ASSET_CACHE_CONTROL);
            if (head.ETag) res.set("ETag", String(head.ETag).replace(/\"/g, ""));
            if (head.LastModified) res.set("Last-Modified", new Date(head.LastModified).toUTCString());
            if (typeof head.ContentLength === 'number') res.set("Content-Length", String(head.ContentLength));
            res.set("Accept-Ranges", "bytes");
            return res.status(200).end();
        }

        // GET object — try keys in order
        let data = null;
        let usedKey = null;
        for (const k of keysToTry) {
            try {
                const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: k });
                data = await s3.send(cmd);
                usedKey = k; break;
            } catch (e) {
                if (e && (e.name === 'NoSuchKey' || e.$metadata?.httpStatusCode === 404)) continue;
                throw e;
            }
        }
        if (!data) return next();

    res.set("X-Source", "s3-proxy");
        if (usedKey) res.set("X-Source-Key", usedKey);
        if (data.ContentType) res.set("Content-Type", data.ContentType);
        res.set("Cache-Control", data.CacheControl || ASSET_CACHE_CONTROL);
        if (data.ETag) res.set("ETag", String(data.ETag).replace(/\"/g, ""));
        if (data.LastModified) res.set("Last-Modified", new Date(data.LastModified).toUTCString());
        if (typeof data.ContentLength === 'number') res.set("Content-Length", String(data.ContentLength));
        res.set("Accept-Ranges", "bytes");

        if (data.Body && typeof data.Body.pipe === "function") {
            return data.Body.pipe(res);
        } else if (data.Body) {
            // In some runtimes Body can be a Uint8Array
            return res.send(data.Body);
        }
        return res.status(404).end();
    } catch (err) {
        // On not found, allow falling back to local static (if exists)
        if (err && (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404)) {
            return next();
        }
        console.error("S3 proxy error:", err);
        return res.status(404).end();
    }
};

// Use a RegExp route to avoid path-to-regexp wildcard syntax differences across versions
app.get(/^\/uploads\/(.+)$/, s3UploadsProxy);
app.head(/^\/uploads\/(.+)$/, s3UploadsProxy);

// Mark static responses for debugging (runs only if proxy called next())
app.use("/uploads", (req, res, next) => { res.set("X-Source", "static"); next(); });
// Local static fallback (for dev or legacy files on disk)
app.use("/uploads", express.static("uploads"));

// ✅ Presigned URL endpoint for direct-to-S3 uploads (admin/farmer only)
app.post("/uploads/presign", authenticateToken, async (req, res) => {
    try {
        if (!USE_S3) {
            return res.status(400).json({ error: "S3 uploads disabled. Set USE_S3=true in environment." });
        }
        if (!s3 || !getSignedUrl || !PutObjectCommand) {
            return res.status(500).json({ error: "S3 SDK not available on server. Install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner." });
        }
        if (req.user.role !== "admin" && req.user.role !== "farmer") {
            return res.status(403).json({ message: "Access denied! Admin or Farmer only." });
        }

        const { contentType, ext } = req.body || {};
        const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
        if (!contentType || !allowed.has(contentType)) {
            return res.status(400).json({ error: "Invalid or missing contentType. Allowed: image/jpeg, image/png, image/webp." });
        }

        const extMap = {
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
        };
        const fileExt = (ext && /^[a-zA-Z0-9]+$/.test(ext)) ? ext : extMap[contentType] || "bin";
        const key = `uploads/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${fileExt}`;

        const cmd = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            ContentType: contentType,
            CacheControl: ASSET_CACHE_CONTROL,
        });
        const url = await getSignedUrl(s3, cmd, { expiresIn: 300 }); // 5 minutes
        const publicUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

        return res.json({
            url,
            key,
            headers: { "Content-Type": contentType, "Cache-Control": ASSET_CACHE_CONTROL },
            publicUrl,
            bucket: S3_BUCKET,
            region: S3_REGION,
        });
    } catch (err) {
        console.error("Presign error:", err);
        return res.status(500).json({ error: "Failed to generate presigned URL" });
    }
});

// ✅ Get All Products
app.get("/products", (req, res) => {
    db.query("SELECT * FROM products", (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// ✅ Get a Single Product by ID
app.get("/products/:id", (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM products WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) {
            return res.status(404).json({ message: "Product not found!" });
        }
        res.json(results[0]);
    });
});

// ✅ Update Product (Admin Only)
app.put("/products/:id", authenticateToken, (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied! Admin only." });
    }

    const { id } = req.params;
// ✅ Health endpoint for load balancers/monitors
app.get("/healthz", (req, res) => {
    res.status(200).json({ ok: true });
});
    const { name, description, price, quantity, image_url } = req.body; // ✅ Changed 'stock' to 'quantity'

    db.query(
        "UPDATE products SET name=?, description=?, price=?, quantity=?, image_url=? WHERE id=?",
        [name, description, price, quantity, image_url, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Product not found!" });
            }
            res.json({ message: "Product updated successfully!" });
        }
    );
});

// ✅ Delete Product (Admin Only)
app.delete("/products/:id", authenticateToken, (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied! Admin only." });
    }

    const { id } = req.params;
    db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Product not found!" });
        }
        res.json({ message: "Product deleted successfully!" });
    });
});

// ✅ Health endpoint for load balancers/monitors
app.get("/healthz", (req, res) => {
    // Optionally add lightweight DB/S3 checks in the future
    res.status(200).json({ ok: true });
});

// ✅ Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
app.post("/cart", authenticateToken, (req, res) => {
    const { product_id, quantity } = req.body;
    const user_id = req.user.id;

    if (!product_id || !quantity) {
        return res.status(400).json({ message: "Product ID and quantity are required!" });
    }

    db.query(
        "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + ?",
        [user_id, product_id, quantity, quantity],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ message: "Item added to cart successfully!" });
        }
    );
});
app.get("/cart", authenticateToken, (req, res) => {
    const user_id = req.user.id;

    db.query(
        "SELECT c.id, p.name, p.price, c.quantity, (p.price * c.quantity) AS total_price FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?",
        [user_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
        }
    );
});
app.put("/cart/:id", authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body; // Get the new quantity from the request body
  
    if (quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be greater than zero." });
    }
  
    // Update the quantity of the item in the cart
    db.query(
      "UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?",
      [quantity, id, user_id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Item not found in cart!" });
        }
        res.json({ message: "Cart item quantity updated successfully!" });
      }
    );
  });
  
app.delete("/cart/:id", authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const { id } = req.params;

    db.query(
        "DELETE FROM cart WHERE id = ? AND user_id = ?",
        [id, user_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Item not found in cart!" });
            }
            res.json({ message: "Item removed from cart!" });
        }
    );
});
app.post("/checkout", authenticateToken, (req, res) => {
    const user_id = req.user.id;

    db.query(
        "SELECT c.product_id, c.quantity, p.price FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?",
        [user_id],
        (err, cartItems) => {
            if (err) return res.status(500).json({ error: err });
            if (cartItems.length === 0) return res.status(400).json({ message: "Cart is empty!" });

            let totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            db.query(
                "INSERT INTO orders (user_id, total_price) VALUES (?, ?)",
                [user_id, totalPrice],
                (err, orderResult) => {
                    if (err) return res.status(500).json({ error: err });

                    let order_id = orderResult.insertId;
                    let orderItemsQuery = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?";
                    let orderItemsData = cartItems.map(item => [order_id, item.product_id, item.quantity, item.price]);

                    db.query(orderItemsQuery, [orderItemsData], (err) => {
                        if (err) return res.status(500).json({ error: err });

                        db.query("DELETE FROM cart WHERE user_id = ?", [user_id]);

                        res.json({ message: "Order placed successfully!", order_id, total_price: totalPrice });
                    });
                }
            );
        }
    );
});
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post("/create-order", authenticateToken, async (req, res) => {
    const { amount, currency } = req.body;

    try {
        const options = {
            amount: amount * 100, // Convert to smallest currency unit
            currency: currency || "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json({ orderId: order.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});app.put("/order/:orderId/status", authenticateToken, (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body; // Assume the new status is sent in the request body
    const user_id = req.user.id;
  
    // Validate that the status is one of the allowed values (for example: "Pending", "Shipped", "Delivered")
    const validStatuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value!" });
    }
  
    // Update the order status in the database
    db.query(
      "UPDATE orders SET status = ? WHERE id = ? AND user_id = ?",
      [status, orderId, user_id],
      (err, result) => {
        if (err) return res.status(500).json({ error: "Database error!" });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Order not found or not authorized!" });
        }
        return res.status(200).json({ message: `Order status updated to ${status}.` });
      }
    );
  });
  
app.get("/admin/orders", authenticateToken, (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied! Admin only." });
    }

    db.query(
        "SELECT o.id, u.name AS customer, o.total_price, o.status, o.created_at FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC",
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
        }
    );
});

// Admin: Update any order status
app.put("/admin/orders/:id/status", authenticateToken, (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied! Admin only." });
    }

    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["Pending", "Shipped", "Delivered", "Cancelled", "Paid"]; // includes Paid per seed
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value!" });
    }

    db.query(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Database error!" });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Order not found!" });
            }
            return res.status(200).json({ message: `Order status updated to ${status}.` });
        }
    );
});
// ✅ Add to Wishlist
app.post("/wishlist", authenticateToken, (req, res) => {
    const { product_id } = req.body;
    const user_id = req.user.id;

    if (!product_id) {
        return res.status(400).json({ error: "Product ID is required!" });
    }

    db.query(
        "SELECT * FROM wishlist WHERE user_id = ? AND product_id = ?",
        [user_id, product_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: "Database error!" });

            if (results.length > 0) {
                return res.status(400).json({ error: "Product already in wishlist!" });
            }

            db.query(
                "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)",
                [user_id, product_id],
                (err) => {
                    if (err) return res.status(500).json({ error: "Failed to add to wishlist!" });
                    res.status(201).json({ message: "Added to wishlist!" });
                }
            );
        }
    );
});


// ✅ Get Wishlist
app.get("/wishlist", authenticateToken, (req, res) => {
    const user_id = req.user.id;

    db.query(
        "SELECT w.id, p.name, p.price, p.image_url FROM wishlist w JOIN products p ON w.product_id = p.id WHERE w.user_id = ?",
        [user_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
        }
    );
});

// ✅ Remove from Wishlist
app.delete("/wishlist/:id", authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const { id } = req.params;

    db.query(
        "DELETE FROM wishlist WHERE id = ? AND user_id = ?",
        [id, user_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Removed from wishlist!" });
        }
    );
});

app.get("/profile", authenticateToken, (req, res) => {
    const user_id = req.user.id;

    db.query("SELECT id, name, email, role FROM users WHERE id = ?", [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error!" });

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found!" });
        }

        res.json({ message: "Profile accessed successfully!", user: results[0] });
    });
});
const PDFDocument = require("pdfkit");

const invoiceDir = "invoices";
if (!fs.existsSync(invoiceDir)) {
  fs.mkdirSync(invoiceDir);  // Create the directory if it doesn't exist
}

app.get("/invoice/:orderId", authenticateToken, (req, res) => {
    const { orderId } = req.params;
    const user_id = req.user.id;
  
    // Fetch order details along with user name & email
    db.query(
      `SELECT 
          o.id, o.total_price, o.status, o.created_at, 
          GROUP_CONCAT(p.name SEPARATOR ', ') AS products, 
          u.name AS user_name, u.email AS user_email 
      FROM orders o 
      JOIN order_items oi ON o.id = oi.order_id 
      JOIN products p ON oi.product_id = p.id 
      JOIN users u ON o.user_id = u.id 
      WHERE o.user_id = ? AND o.id = ? 
      GROUP BY o.id`,
      [user_id, orderId],
      (err, results) => {
        if (err) return res.status(500).json({ error: "Database error!" });
        if (results.length === 0) return res.status(404).json({ message: "Order not found!" });
  
        const order = results[0];
  
        // Create PDF Invoice
        const doc = new PDFDocument();
        const filePath = `${invoiceDir}/order_${order.id}.pdf`;
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
  
        doc.fontSize(20).text("Invoice", { align: "center" });
        doc.moveDown();
        
        // Include user details
        doc.fontSize(14).text(`Customer Name: ${order.user_name}`);
        doc.text(`Customer Email: ${order.user_email}`);
        doc.moveDown();
  
        // Order details
        doc.text(`Order ID: ${order.id}`);
        doc.text(`Total Price: ₹${order.total_price}`);
        doc.text(`Ordered On: ${new Date(order.created_at).toLocaleString()}`);
        doc.moveDown();
        doc.text(`Products: ${order.products}`);
  
        doc.end();
  
        // Send File Once Ready
        stream.on("finish", () => {
          res.download(filePath, `Invoice_Order_${order.id}.pdf`, (err) => {
            if (err) {
              console.error("Error sending the file:", err);
              return res.status(500).json({ error: "Failed to send the invoice!" });
            }
          });
        });
  
        stream.on("error", (err) => {
          console.error("Error creating PDF:", err);
          res.status(500).json({ error: "Failed to create the invoice!" });
        });
      }
    );
  });
  app.get("/search", (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Search query is required!" });

    db.query("SELECT * FROM products WHERE name LIKE ?", [`%${q}%`], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error!" });
        res.json(results);
    });
});app.post("/payment/success/:id", authenticateToken, async (req, res) => {
    const orderId = req.params.id;
    try {
      await db.query("UPDATE orders SET status = ? WHERE id = ?", ["Paid", orderId]);
      res.json({ message: "Payment simulated and status updated." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Payment simulation failed" });
    }
  });
  
  
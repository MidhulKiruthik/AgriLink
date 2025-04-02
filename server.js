const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const app = express();
const port = 5000;
const cors = require("cors");
app.use(cors());
require("dotenv").config();

console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);
console.log("Razorpay Key Secret:", process.env.RAZORPAY_KEY_SECRET);


app.use(express.json()); // ✅ Middleware to parse JSON requests

const SECRET_KEY = "your_secret_key"; // Replace with a strong secret key

// ✅ MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "00000", // Replace with your MySQL password
    database: "agri_ecommerce"
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

        db.query(
            "INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)",
            [name, email, hashedPassword, phone, address, role],
            (err) => {
                if (err) return res.status(500).json({ error: "Failed to register user!" });
                res.status(201).json({ message: "User registered successfully!" });
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
        { expiresIn: "24h" }
      );
      //localStorage.setItem("token", response.data.token);

      // Send token and farmer_id (or user.id) along with the login success message
      res.json({
        message: "Login successful!",
        token,
        farmer_id: user.farmer_id, // Send farmer_id (or user.id) if relevant
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

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: "uploads/", // Images will be saved in 'uploads' folder
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});
const upload = multer({ storage });
app.post("/products", authenticateToken, upload.single("image"), (req, res) => {
    console.log("Incoming request:", req.body);
    console.log("Uploaded file:", req.file);
    console.log("User Role:", req.user.role);

    if (req.user.role !== "admin" && req.user.role !== "farmer") {
        return res.status(403).json({ message: "Access denied! Admin or Farmer only." });
    }

    const { farmer_id, name, description, price, quantity, category } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !price || !quantity) {
        return res.status(400).json({ message: "Name, price, and quantity are required!" });
    }

    db.query(
        "INSERT INTO products (farmer_id, name, description, price, quantity, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [farmer_id || null, name, description, price, quantity, category, image_url],
        (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ error: err });
            }
            res.status(201).json({ message: "Product added successfully!", image_url });
        }
    );
});


// ✅ Serve uploaded images
app.use("/uploads", express.static("uploads"));

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
});const PDFDocument = require("pdfkit");
const fs = require("fs");

const invoiceDir = "invoices";
if (!fs.existsSync(invoiceDir)) {
  fs.mkdirSync(invoiceDir);  // Create the directory if it doesn't exist
}

app.get("/invoice/:orderId", authenticateToken, (req, res) => {
  const { orderId } = req.params;
  const user_id = req.user.id;

  // Fetch order details from database
  db.query(
    "SELECT o.id, o.total_price, o.status, o.created_at, GROUP_CONCAT(p.name SEPARATOR ', ') AS products FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id WHERE o.user_id = ? AND o.id = ? GROUP BY o.id",
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
      doc.fontSize(14).text(`Order ID: ${order.id}`);
      doc.text(`Total Price: ₹${order.total_price}`);
      doc.text(`Status: ${order.status}`);
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

      // Handle errors in creating the PDF
      stream.on("error", (err) => {
        console.error("Error creating PDF:", err);
        res.status(500).json({ error: "Failed to create the invoice!" });
      });
    }
  );
});app.get("/search", (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Search query is required!" });

    db.query("SELECT * FROM products WHERE name LIKE ?", [`%${q}%`], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error!" });
        res.json(results);
    });
});

  
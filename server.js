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

        res.json({ message: "Login successful!", token });
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


// ✅ Add Product (Admin Only)
app.post("/products", authenticateToken, (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied! Admin only." });
    }

    const { farmer_id, name, description, price, quantity, category, image_url } = req.body;

    if (!farmer_id || !name || !price || !quantity) {
        return res.status(400).json({ message: "Farmer ID, name, price, and quantity are required!" });
    }

    db.query(
        "INSERT INTO products (farmer_id, name, description, price, quantity, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [farmer_id, name, description, price, quantity, category, image_url],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(201).json({ message: "Product added successfully!" });
        }
    );
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
});
app.put("/orders/:id/status", authenticateToken, (req, res) => {
    if (req.user.role !== "farmer" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied! Only Farmers/Admin can update status." });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["Pending", "Shipped", "Delivered"].includes(status)) {
        return res.status(400).json({ message: "Invalid status!" });
    }

    db.query(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Order not found!" });
            }
            res.json({ message: `Order status updated to ${status}!` });
        }
    );
});
app.get("/orders", authenticateToken, (req, res) => {
    const user_id = req.user.id;
    db.query("SELECT * FROM orders WHERE user_id = ?", [user_id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});
app.get("/orders", authenticateToken, (req, res) => {
    const user_id = req.user.id;

    db.query(
        "SELECT o.id, o.total_price, o.status, o.created_at, GROUP_CONCAT(p.name SEPARATOR ', ') AS products FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id WHERE o.user_id = ? GROUP BY o.id",
        [user_id],
        (err, results) => {
            if (err) return res.status(500).json({ error: err });
            res.json(results);
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
});app.get("/products/search", (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: "Query parameter is required!" });
    }

    // SQL query to search products by name
    let sql = "SELECT * FROM products WHERE name LIKE ?";
    let params = [`%${query}%`];

    // Execute the query
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err });

        // If no products are found
        if (results.length === 0) {
            return res.status(404).json({ message: "Product not found!" });
        }

        // Send results as response
        res.json(results);
    });
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

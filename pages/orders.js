import { useState, useEffect } from "react";
import axios from "axios";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/orders", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>My Orders</h2>
      
      {orders.length === 0 ? (
        <p style={styles.emptyMessage}>No orders found.</p>
      ) : (
        <ul style={styles.orderList}>
          {orders.map((order) => (
            <li key={order.id} style={styles.orderCard}>
              <p style={styles.orderId}>Order ID: {order.id}</p>
              <p><strong>Total Price:</strong> ₹{order.total_price}</p>
              <p><strong>Status:</strong> <span style={styles.status(order.status)}>{order.status}</span></p>
              <p><strong>Ordered On:</strong> {new Date(order.created_at).toLocaleString()}</p>
              
              <div style={styles.productsContainer}>
                <h4>Products:</h4>
                <ul style={styles.productList}>
                  {order.products.map((product) => (
                    <li key={product.id} style={styles.productItem}>
                      {product.name} - ₹{product.price} x {product.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 🔹 **Inline CSS for Orders Page**
const styles = {
  container: {
    maxWidth: "800px",
    margin: "auto",
    padding: "20px",
  },
  heading: {
    fontSize: "24px",
    textAlign: "center",
    marginBottom: "20px",
    fontWeight: "bold",
  },
  emptyMessage: {
    textAlign: "center",
    fontSize: "18px",
    color: "#888",
  },
  orderList: {
    listStyleType: "none",
    padding: 0,
  },
  orderCard: {
    backgroundColor: "#fff",
    padding: "15px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginBottom: "20px",
  },
  orderId: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "5px",
  },
  status: (status) => ({
    color: status === "Pending" ? "orange" : status === "Shipped" ? "blue" : "green",
    fontWeight: "bold",
  }),
  productsContainer: {
    marginTop: "10px",
  },
  productList: {
    listStyleType: "none",
    padding: 0,
  },
  productItem: {
    backgroundColor: "#f9f9f9",
    padding: "8px",
    marginBottom: "5px",
    borderRadius: "5px",
  },
};


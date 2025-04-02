import { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../components/Layout";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/orders", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert("Failed to fetch orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5000/invoice/${orderId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to download invoice: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice! Please try again.");
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/order/${orderId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert(response.data.message);
      fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update order status. Please try again.");
    }
  };

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.heading}>My Orders</h2>
          <p style={styles.subHeading}>View and manage your order history</p>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingMessage}>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📦</div>
            <h3 style={styles.emptyTitle}>No orders yet</h3>
            <p style={styles.emptyText}>Your order history will appear here once you make purchases</p>
          </div>
        ) : (
          <div style={styles.ordersGrid}>
            {orders.map((order) => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.cardHeader}>
                  <div>
                  
                   
                  </div>
                  <div style={styles.statusBadge(order.status)}>
                    {order.status}
                  </div>
                </div>

                <div style={styles.orderDetails}>
                  <div style={styles.detailItem}>
                    <p style={styles.detailLabel}>Date</p>
                    <p style={styles.detailValue}>{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div style={styles.detailItem}>
                    <p style={styles.detailLabel}>Total</p>
                    <p style={styles.detailValue}>₹{order.total_price}</p>
                  </div>
                </div>

                <div style={styles.productsSection}>
                  <p style={styles.sectionTitle}>Products</p>
                  <ul style={styles.productList}>
                    {Array.isArray(order.products) ? (
                      order.products.map((product, index) => (
                        <li key={index} style={styles.productItem}>
                          <span style={styles.productBullet}>•</span> {product.name || product}
                        </li>
                      ))
                    ) : (
                      <p>No products found.</p>
                    )}
                  </ul>
                </div>

                <div style={styles.actionButtons}>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    style={styles.statusDropdown}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <button 
                    onClick={() => downloadInvoice(order.id)} 
                    style={styles.invoiceButton}
                  >
                    <span style={styles.buttonIcon}>📄</span> Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "30px 20px",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    textAlign: "center",
    marginBottom: "40px",
  },
  heading: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: "8px",
  },
  subHeading: {
    fontSize: "16px",
    color: "#718096",
    margin: "0",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
  },
  spinner: {
    border: "4px solid rgba(0, 0, 0, 0.1)",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    borderLeftColor: "#4299e1",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  loadingMessage: {
    fontSize: "16px",
    color: "#4a5568",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    maxWidth: "500px",
    margin: "0 auto",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: "8px",
  },
  emptyText: {
    fontSize: "14px",
    color: "#718096",
    margin: "0",
  },
  ordersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "24px",
  },
  orderCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    padding: "24px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    },
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #edf2f7",
  },
  orderLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#718096",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "4px",
  },
  orderId: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#2d3748",
    margin: "0",
  },
  statusBadge: (status) => ({
    fontSize: "12px",
    fontWeight: "600",
    padding: "6px 12px",
    borderRadius: "20px",
    backgroundColor: 
      status === "Pending" ? "#fffaf0" : 
      status === "Shipped" ? "#ebf8ff" : 
      status === "Delivered" ? "#f0fff4" : "#fff5f5",
    color: 
      status === "Pending" ? "#dd6b20" : 
      status === "Shipped" ? "#3182ce" : 
      status === "Delivered" ? "#38a169" : "#e53e3e",
  }),
  orderDetails: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    marginBottom: "20px",
  },
  detailItem: {
    marginBottom: "4px",
  },
  detailLabel: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#718096",
    marginBottom: "4px",
  },
  detailValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2d3748",
    margin: "0",
  },
  productsSection: {
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: "12px",
  },
  productList: {
    listStyle: "none",
    padding: "0",
    margin: "0",
  },
  productItem: {
    display: "flex",
    alignItems: "center",
    fontSize: "14px",
    color: "#4a5568",
    padding: "6px 0",
  },
  productBullet: {
    color: "#a0aec0",
    marginRight: "8px",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
  },
  statusDropdown: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#f8fafc",
    color: "#4a5568",
    cursor: "pointer",
    flex: "1",
    marginRight: "12px",
    ":focus": {
      outline: "none",
      borderColor: "#4299e1",
      boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.2)",
    },
  },
  invoiceButton: {
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: "600",
    backgroundColor: "#4299e1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    transition: "background-color 0.2s ease",
    ":hover": {
      backgroundColor: "#3182ce",
    },
  },
  buttonIcon: {
    marginRight: "8px",
    fontSize: "16px",
  },
};
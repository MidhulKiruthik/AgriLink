import Layout from "../components/Layout";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function SuccessPage() {
  const router = useRouter();
  const { orderId } = router.query;

  const downloadInvoice = async () => {
    try {
      const response = await fetch(`http://localhost:5000/invoice/${orderId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_Order_${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error("Download error:", error.message);
      alert("Error: " + error.message);
    }
  };

  return (
    <Layout>
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <h1>✅ Payment Successful</h1>
        <p>Your order has been confirmed!</p>
        <center>
        <button onClick={downloadInvoice} style={styles.invoiceButton} >
          <span style={styles.buttonIcon}>📄</span> Invoice
        </button></center>
        <br />
        
      </div>
    </Layout>
  );
}

const styles = {
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
    gap: "5px",
  },
  buttonIcon: {
    fontSize: "16px",
  },
};

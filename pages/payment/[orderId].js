import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../components/Layout";

export default function PaymentPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      setOrderId(router.query.orderId); // ✅ set it into state
    }
  }, [router.isReady]);
  
  

  const handlePayment = async () => {
    if (!orderId) {
      alert("Order ID is missing");
      return;
    }

    setProcessing(true);
    // simulate payment
    alert("Payment Successful!");
    router.push(`/success?orderId=${orderId}`);
    setProcessing(false);
  };

  return (
    <Layout>
      <div style={{ maxWidth: 500, margin: "auto", padding: "2rem" }}>
        <h2>Simulated Payment</h2>
        <input
          placeholder="Card Number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />
        <input
          placeholder="CVV"
          value={cvv}
          onChange={(e) => setCvv(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
        />
        <button
          onClick={handlePayment}
          disabled={processing}
          style={{
            padding: "10px 20px",
            backgroundColor: "#38a169",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          {processing ? "Processing..." : "Pay ₹"}
        </button>
      </div>
    </Layout>
  );
}

import { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../components/Layout";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await axios.get("http://localhost:5000/cart", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCartItems(res.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const removeFromCart = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/cart/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchCart(); // Refresh cart after removal
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleCheckout = async () => {
    try {
      await axios.post("http://localhost:5000/checkout", {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Order placed successfully!");
      fetchCart(); // Clear cart after successful order
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Failed to place order.");
    }
  };

  return (
    <Layout>
      <h2 style={{ textAlign: "center", fontSize: "24px", marginBottom: "20px" }}>Your Cart</h2>

      {cartItems.length === 0 ? (
        <p style={{ textAlign: "center", fontSize: "18px" }}>Your cart is empty.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: "0" }}>
          {cartItems.map((item) => (
            <li key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px", borderBottom: "1px solid #ddd" }}>
              <span>{item.name} - ₹{item.price} x {item.quantity}</span>
              <button onClick={() => removeFromCart(item.id)} style={{ background: "red", color: "white", border: "none", padding: "5px 10px", cursor: "pointer" }}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {cartItems.length > 0 && (
        <button onClick={handleCheckout} style={{ display: "block", margin: "20px auto", padding: "10px 20px", background: "green", color: "white", border: "none", cursor: "pointer" }}>
          Proceed to Checkout
        </button>
      )}
    </Layout>
  );
}

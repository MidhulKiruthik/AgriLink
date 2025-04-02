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
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to log in first!");
        window.location.href = "/login"; // Redirect to login page
        return;
      }

      const res = await axios.get("http://localhost:5000/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(res.data);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        alert("Your session has expired. Please log in again.");
        window.location.href = "/login"; // Redirect to login
      } else {
        console.error("Error fetching cart:", error);
      }
    }
  };

  const removeFromCart = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to log in first!");
        window.location.href = "/login"; // Redirect to login page
        return;
      }

      await axios.delete(`http://localhost:5000/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCart(); // Refresh cart after removal
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) {
      alert("Quantity cannot be less than 1.");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to log in first!");
        window.location.href = "/login"; // Redirect to login page
        return;
      }

      await axios.put(
        `http://localhost:5000/cart/${id}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCart(); // Refresh cart after updating quantity
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleQuantityChange = (e, id) => {
    const newQuantity = e.target.value;
    if (newQuantity && newQuantity > 0) {
      updateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to log in first!");
        window.location.href = "/login"; // Redirect to login page
        return;
      }

      await axios.post("http://localhost:5000/checkout", {}, {
        headers: { Authorization: `Bearer ${token}` },
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
            <li
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px",
                borderBottom: "1px solid #ddd",
              }}
            >
              <span>
                {item.name} - ₹{item.price} x 
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(e, item.id)}
                  min="1"
                  style={{ width: "50px", marginLeft: "10px" }}
                />
              </span>
              <button
                onClick={() => removeFromCart(item.id)}
                style={{
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {cartItems.length > 0 && (
        <button
          onClick={handleCheckout}
          style={{
            display: "block",
            margin: "20px auto",
            padding: "10px 20px",
            background: "green",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Proceed to Checkout
        </button>
      )}
    </Layout>
  );
}

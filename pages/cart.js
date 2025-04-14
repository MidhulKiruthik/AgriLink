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
        window.location.href = "/login";
        return;
      }

      const res = await axios.get("http://localhost:5000/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(res.data);
    } catch (error) {
      if (error.response?.status === 403) {
        alert("Session expired. Please log in again.");
        window.location.href = "/login";
      } else {
        console.error("Error fetching cart:", error);
      }
    }
  };

  const removeFromCart = async (id) => {
    const confirmRemove = window.confirm("Remove this item from cart?");
    if (!confirmRemove) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to log in first!");
        window.location.href = "/login";
        return;
      }

      await axios.delete(`http://localhost:5000/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCart();
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) return alert("Minimum quantity is 1");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to log in first!");
        window.location.href = "/login";
        return;
      }

      await axios.put(
        `http://localhost:5000/cart/${id}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleQuantityChange = (e, id) => {
    const newQuantity = parseInt(e.target.value);
    if (newQuantity > 0) {
      updateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to log in first!");
        window.location.href = "/login";
        return;
      }

      await axios.post("http://localhost:5000/checkout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("🎉 Order placed successfully!");
      fetchCart();
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Failed to place order.");
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((acc, product) => acc + product.price * product.quantity, 0);
  };

  return (
    <Layout>
      <div className="cart-container">
        <h2>Your Cart</h2>
        {cartItems.length === 0 ? (
          <p className="empty-text">Your cart is empty.</p>
        ) : (
          <>
            <ul className="cart-list">
              {cartItems.map((product) => (
                <li key={product.id} className="cart-item">
                 
                  <div className="details">
                    <h4>{product.name}</h4>
                    <p>₹{product.price} x</p>
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => handleQuantityChange(e, product.id)}
                      min="1"
                    />
                  </div>
                  <button onClick={() => removeFromCart(product.id)} className="remove-btn">Remove</button>
                </li>
              ))}
            </ul>
            <div className="checkout-section">
              <p>Total: ₹{calculateTotal()}</p>
              <button onClick={handleCheckout} className="checkout-btn">Proceed to Checkout</button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .cart-container {
          max-width: 800px;
          margin: auto;
          padding: 20px;
        }

        h2 {
          text-align: center;
          font-size: 28px;
          margin-bottom: 20px;
        }

        .empty-text {
          text-align: center;
          font-size: 18px;
          color: #777;
        }

        .cart-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .cart-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #ddd;
          padding: 10px 0;
        }

        .cart-item img {
          width: 70px;
          height: 70px;
          object-fit: cover;
          border-radius: 5px;
          margin-right: 15px;
        }

        .details {
          flex: 1;
        }

        .details h4 {
          margin: 0 0 5px;
        }

        .details p {
          display: inline-block;
          margin-right: 10px;
        }

        .details input {
          width: 50px;
          padding: 5px;
        }

        .remove-btn {
          background-color: #e74c3c;
          color: white;
          border: none;
          padding: 6px 12px;
          cursor: pointer;
          border-radius: 4px;
        }

        .remove-btn:hover {
          background-color: #c0392b;
        }

        .checkout-section {
          margin-top: 20px;
          text-align: right;
        }

        .checkout-section p {
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 10px;
        }

        .checkout-btn {
          background-color: #27ae60;
          color: white;
          border: none;
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          border-radius: 4px;
        }

        .checkout-btn:hover {
          background-color: #219150;
        }
      `}</style>
    </Layout>
  );
}

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
    <div className="container">
      <h2>My Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              <p><strong>Order ID:</strong> {order.id}</p>
              <p><strong>Total Price:</strong> ₹{order.total_price}</p>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Ordered On:</strong> {new Date(order.created_at).toLocaleString()}</p>
              <p><strong>Products:</strong></p>
              <ul>
                {order.products.map((product) => (
                  <li key={product.id}>
                    {product.name} - ₹{product.price} x {product.quantity}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

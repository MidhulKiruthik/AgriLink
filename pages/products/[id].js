import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../components/Layout"; // ✅ Ensure correct path

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      axios
        .get(`http://localhost:5000/products/${id}`)
        .then((res) => setProduct(res.data))
        .catch((err) => console.error("Error fetching product:", err));
    }
  }, [id]);

  const addToCart = async () => {
    try {
      await axios.post(
        "http://localhost:5000/cart",
        { product_id: id, quantity },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      alert("Product added to cart!");
    } catch (error) {
      console.error("Add to cart failed:", error);
    }
  };

  if (!product) return <p>Loading product details...</p>;

  return (
    <Layout>
      <div style={{ maxWidth: "900px", margin: "auto", padding: "20px" }}>
        <a href="/products">← Back to Products</a>
        <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
          <div style={{ flex: "1", textAlign: "center" }}>
            <img src={product.image_url} alt={product.name} width="100%" height="350px" />
          </div>
          <div style={{ flex: "1" }}>
            <h1>{product.name}</h1>
            <p style={{ fontSize: "20px", color: "green" }}>₹{product.price}</p>
            <p>{product.description}</p>
            <div>
              <button onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}>-</button>
              <span style={{ margin: "0 10px" }}>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button
              onClick={addToCart}
              style={{
                marginTop: "10px",
                padding: "10px",
                backgroundColor: "black",
                color: "white",
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

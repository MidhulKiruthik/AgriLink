import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`http://localhost:5000/products/search?query=${search}`);
      setProducts(res.data);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  return (
    <Layout>
      <h1 style={{ textAlign: "center", fontSize: "24px", marginBottom: "20px" }}>Products</h1>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search products..."
          style={{ padding: "10px", width: "60%", border: "1px solid #ccc" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" style={{ padding: "10px 20px", background: "green", color: "white", border: "none", cursor: "pointer" }}>
          Search
        </button>
      </form>

      {/* Product List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
        {products.length > 0 ? (
          products.map((product) => (
            <div key={product.id} style={{ border: "1px solid #ddd", padding: "10px", textAlign: "center", borderRadius: "8px" }}>
              <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "150px", objectFit: "cover" }} />
              <h2 style={{ fontSize: "18px", margin: "10px 0" }}>{product.name}</h2>
              <p style={{ color: "#666" }}>{product.description}</p>
              <p style={{ color: "green", fontWeight: "bold" }}>₹{product.price}</p>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", fontSize: "18px" }}>No products found.</p>
        )}
      </div>
    </Layout>
  );
}

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Layout from "../../components/Layout";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

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

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!search.trim()) return;

    try {
      const res = await axios.get(`http://localhost:5000/search?q=${search}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
      alert("Failed to fetch search results!");
    }
  };

  const handleClear = () => {
    setSearch("");
    fetchProducts(); // Reload all products
  };

  return (
    <Layout>
      <div className="products-container">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="Search for fresh produce..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">🔍</button>
          {search && (
            <button type="button" onClick={handleClear} className="clear-button">
              Clear All
            </button>
          )}
        </form>

        <h2 className="products-heading">Fresh & Organic Products</h2>

        {/* Product List */}
        <div className="products-wrapper">
          {products.length > 0 ? (
            products.map((product) => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => router.push(`/products/${product.id}`)}
                style={{ cursor: "pointer" }}
              >
                <img src={product.image_url} alt={product.name} className="product-image" />
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">₹{product.price}</p>
                  <button className="add-to-cart-button">More Info</button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-products">No products available.</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

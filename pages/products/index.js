import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Layout from "../../components/Layout";
import { resolveImageSrc } from "../../utils/image";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Products page is public; fetch without requiring login
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
  const res = await axios.get("/api/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!search.trim()) return;

    try {
      setLoading(true);
      const res = await axios.get(`/api/search?q=${encodeURIComponent(search)}`);
      setProducts(res.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
      alert("Failed to fetch search results!");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearch("");
    fetchProducts();
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
              ❌
            </button>
          )}
        </form>

        <h2 className="products-heading">Fresh & Organic Products</h2>

        {loading ? (
          <p className="loader">Loading products...</p>
        ) : (
          <div className="products-wrapper">
            {products.length > 0 ? (
              products.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <img
                    src={resolveImageSrc(product.image_url)}
                    alt={product.name}
                    className="product-image"
                    onError={(e) => { e.currentTarget.src = '/uploads/placeholder-product.jpg'; }}
                  />
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">₹{product.price}</p>
                    <button className="add-to-cart-button">More Info</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-products">😕 No products found.</p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

export default function Home() {
  const router = useRouter();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleShopNow = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      router.push("/products");
    } else {
      router.push("/login");
    }
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/products");
        const items = Array.isArray(res.data) ? res.data.slice(0, 6) : [];
        setFeatured(items);
      } catch (e) {
        setFeatured([]);
        console.error("fetchFeatured error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <Layout>
      <div className="home-container">
        <div className="cta-bar">
          <span>Fresh from local farms • Secure payments • Fast delivery</span>
        </div>

        <section className="hero">
          <div className="hero-overlay" />
          <h1><span className="brand">AgriLink</span></h1>
          <p className="hero-sub">Your trusted marketplace for fresh & organic produce.</p>

          <section className="hero-section">
            <button
              type="button"
              onClick={handleShopNow}
              className="shop-now-btn px-6 py-3 bg-green-600 text-white font-semibold rounded-full shadow-md hover:bg-green-700 active:scale-95 transition-all duration-300"
            >
              Shop Now
            </button>

            <div className="hero-badges flex flex-wrap justify-center gap-3 mt-4 text-sm">
              <span>✓ Farm-to-table</span>
              <span>✓ Fair pricing</span>
              <span>✓ Local sellers</span>
            </div>
          </section>
        </section>

        <section className="categories">
          <h3 className="section-subtitle">Browse by Category</h3>
          <div className="chip-row">
            {["Fruits", "Vegetables", "Leafy Greens", "Cereals", "Dairy"].map((c) => (
              <button
                key={c}
                type="button"
                className="chip"
                onClick={() => router.push("/products")}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="farmers">
          <h2>Become a Seller</h2>
          <p>Join AgriLink and start selling your fresh, organic produce to a wide audience.</p>
          <button
            type="button"
            className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-full shadow-md hover:bg-amber-700 active:scale-95 transition-all duration-300"
            onClick={() => router.push("/farmer-dashboard")}
          >
            Become a Seller
          </button>
        </section>

        <section className="testimonials">
          <h2>What Our Customers Say</h2>
          <div className="testimonial-cards">
            <div className="testimonial-card">
              <p>"Best platform! The produce is always fresh and delivered on time."</p>
              <span>- Happy Customer</span>
            </div>
            <div className="testimonial-card">
              <p>"As a farmer, AgriLink has helped me reach a broader audience. Highly recommend!"</p>
              <span>- Satisfied Farmer</span>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

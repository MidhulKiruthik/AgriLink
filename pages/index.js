import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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

        <motion.section
          className="hero"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="hero-overlay" />
          <h1><span className="brand">AgriLink</span></h1>
          <p className="hero-sub">Your trusted marketplace for fresh & organic produce.</p>

          <section className="hero-section">
            <button
              type="button"
              onClick={handleShopNow}
              className="shop-now-btn transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              Shop Now
            </button>

            <div className="hero-badges flex flex-wrap justify-center gap-3 mt-4 text-sm">
              <span>✓ Farm-to-table</span>
              <span>✓ Fair pricing</span>
              <span>✓ Local sellers</span>
            </div>
          </section>
        </motion.section>

        <section className="categories">
          <h3 className="section-subtitle">Browse by Category</h3>
          <div className="chip-row">
            {["Fruits", "Vegetables", "Leafy Greens", "Cereals", "Dairy"].map((c) => (
              <button key={c} type="button" className="chip" onClick={() => router.push("/products")}>
                {c}
              </button>
            ))}
          </div>
        </section>

        <motion.section
          className="farmers"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <h2>Become a Seller</h2>
          <p>Join AgriLink and start selling your fresh, organic produce to a wide audience.</p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/farmer-dashboard")}
          >
            Become a Seller
          </motion.button>
        </motion.section>

        <motion.section
          className="testimonials"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <h2>What Our Customers Say</h2>
          <div className="testimonial-cards">
            <div className="testimonial-card">
              <p>"Great platform! The produce is always fresh and delivered on time."</p>
              <span>- Happy Customer</span>
            </div>
            <div className="testimonial-card">
              <p>"As a farmer, AgriLink has helped me reach a broader audience. Highly recommend!"</p>
              <span>- Satisfied Farmer</span>
            </div>
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}

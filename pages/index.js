import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Layout from "../components/Layout";
import { resolveImageSrc } from "../utils/image";

export default function Home() {
  const router = useRouter();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleShopNow = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      // Optional: verify token client-side (expiry) or call a quick /auth/validate
      await router.push("/products");
    } else {
      await router.push("/login");
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
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <Layout>
    <div className="home-container">
      {/* Top CTA bar */}
      <div className="cta-bar">
        <span>Fresh from local farms • Secure payments • Fast delivery</span>
      </div>
      {/* Hero Section */}
      <motion.section
        className="hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="hero-overlay" />
        <h1><span className="brand">AgriLink</span></h1>
        <p className="hero-sub">Your trusted marketplace for fresh & organic produce.</p>
        <motion.button type="button" onClick={handleShopNow} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          Shop Now
        </motion.button>
        <div className="hero-badges">
          <span>✓ Farm-to-table</span>
          <span>✓ Fair pricing</span>
          <span>✓ Local sellers</span>
        </div>
      </motion.section>

      {/* Categories */}
      <section className="categories">
        <h3 className="section-subtitle">Browse by Category</h3>
        <div className="chip-row">
          {["Fruits","Vegetables","Leafy Greens","Cereals","Dairy"].map((c)=> (
            <button key={c} className="chip" onClick={()=>router.push("/products")}>{c}</button>
          ))}
        </div>
      </section>

      {/* Farmers Section */}
      <motion.section
        className="farmers"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <h2>Become a Seller</h2>
        <p>Join AgriLink and start selling your fresh, organic produce to a wide audience.</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/farmer-dashboard")}
        >
          Become a Seller
        </motion.button>
      </motion.section>

      {/* Testimonials Section */}
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

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
    const token = localStorage.getItem("token");
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShopNow}
        >
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

      {/* Featured Products Section */}
      <motion.section
        className="featured"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <h2>Featured Products</h2>
        {loading ? (
          <p className="loader">Loading fresh picks…</p>
        ) : (
          <div className="product-grid">
            {featured.length === 0 ? (
              <p className="no-products">No products yet. Check back soon!</p>
            ) : (
              featured.map((p) => {
                let img = '/uploads/placeholder-product.jpg';
                if (p?.image_url) {
                  if (p.image_url.startsWith('http')) img = p.image_url;
                  else if (p.image_url.startsWith('/uploads')) {
                    const cdn = process.env.NEXT_PUBLIC_CDN_URL;
                    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
                    const region = process.env.NEXT_PUBLIC_S3_REGION || 'eu-north-1';
                    if (cdn) img = `${cdn}${p.image_url}`; // p.image_url includes leading slash
                    else if (bucket) img = `https://${bucket}.s3.${region}.amazonaws.com${p.image_url}`;
                    else img = p.image_url; // local dev fallback
                  } else if (p.image_url.startsWith('uploads/')) {
                    const cdn = process.env.NEXT_PUBLIC_CDN_URL;
                    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
                    const region = process.env.NEXT_PUBLIC_S3_REGION || 'eu-north-1';
                    if (cdn) img = `${cdn}/${p.image_url}`;
                    else if (bucket) img = `https://${bucket}.s3.${region}.amazonaws.com/${p.image_url}`;
                    else img = `/uploads/${p.image_url}`; // fallback for local dev
                  } else img = `/uploads/${p.image_url}`;
                }
                return (
                  <motion.div key={p.id} className="product-card" whileHover={{ y: -4 }} onClick={()=>router.push(`/products/${p.id}`)}>
                    <div className="product-thumb">
                      <img src={img} alt={p.name} />
                    </div>
                    <div className="product-meta">
                      <h4 className="product-name">{p.name}</h4>
                      <div className="product-row">
                        <span className="product-price">₹{p.price}</span>
                        <button className="ghost-btn">View</button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
        <div className="center">
          <button className="outline-btn" onClick={()=>router.push('/products')}>Browse All Products</button>
        </div>
      </motion.section>

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

import { useRouter } from "next/router";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();

  const handleShopNow = () => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/products");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <motion.section
        className="hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <h1>AgriLink</h1>
        <p>Your trusted marketplace for fresh & organic produce.</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShopNow}
        >
          Shop Now
        </motion.button>
      </motion.section>

      {/* Featured Products Section */}
      <motion.section
        className="featured"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <h2>Featured Products</h2>
        <div className="product-grid">
          {['🥑 Avocado', '🌽 Corn', '🍇 Grapes', '🥕 Carrots', '🍉 Watermelon'].map((product, index) => (
            <motion.div key={index} className="product-card" whileHover={{ scale: 1.05 }}>
              {product}
            </motion.div>
          ))}
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
  );
}

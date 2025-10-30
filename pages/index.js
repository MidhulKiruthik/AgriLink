import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Layout from "../components/Layout";
import { resolveImageSrc } from "../utils/image";
import { toast } from "react-hot-toast";
import "../agri-ecommerce/src/index.css";

export default function Home() {
  const router = useRouter();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleShopNow = async () => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        // Optional: Validate token with an API call
        await axios.get("/api/auth/validate");
        router.push("/products");
      } catch (err) {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
      }
    } else {
      toast.error("Please log in to continue shopping");
      router.push("/login");
    }
  };

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await axios.get("/api/products/featured");
        setFeatured(res.data);
      } catch (err) {
        console.error("Error fetching featured products:", err);
        toast.error("Failed to load featured products. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <Layout>
      <motion.section
        className="hero-section flex flex-col md:flex-row items-center justify-between p-8 md:p-16 bg-green-50 rounded-2xl shadow-md"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="hero-text max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold text-green-800 mb-4">
            Fresh from Local Farms
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Discover organic produce and support your local farmers — all in one click.
          </p>
          <motion.button
            type="button"
            onClick={handleShopNow}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-green-700 transition"
          >
            Shop Now
          </motion.button>
          <div className="hero-badges mt-6 flex gap-4 text-green-700 font-medium">
            <span>✓ Farm-to-table</span>
            <span>✓ Fair pricing</span>
            <span>✓ Local sellers</span>
          </div>
        </div>

        <motion.div
          className="hero-image mt-8 md:mt-0 md:ml-12"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <img
            src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop"
            alt="Farmers Market"
            className="rounded-2xl shadow-lg w-full max-w-md"
          />
        </motion.div>
      </motion.section>

      {!loading && featured.length > 0 && (
        <section className="featured mt-16 px-8">
          <h2 className="text-3xl font-bold text-green-800 mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map((product) => (
              <motion.div
                key={product.id}
                className="bg-white shadow-md rounded-xl p-4 hover:shadow-lg transition relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={resolveImageSrc(product.image)}
                  alt={product.name}
                  className="rounded-lg w-full h-48 object-cover mb-4"
                  onError={(e) => (e.currentTarget.src = "https://images.unsplash.com/photo-1602524814900-1f05e9b2a9f8?q=80&w=800&auto=format&fit=crop")}
                />
                <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                <p className="text-green-700 font-bold mt-2">₹{product.price}</p>
                <button
                  className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm hover:bg-green-700 transition"
                  onClick={() => toast.success(`${product.name} added to wishlist!`)}
                >
                  ♥ Wishlist
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {!loading && featured.length === 0 && (
        <motion.p
          className="text-center text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          No featured products available.
        </motion.p>
      )}

      <section className="newsletter mt-16 px-8 py-12 bg-green-100 rounded-xl shadow-md">
        <h2 className="text-3xl font-bold text-green-800 mb-4">Stay Updated</h2>
        <p className="text-lg text-gray-700 mb-6">Subscribe to our newsletter for the latest updates and offers.</p>
        <form className="flex flex-col md:flex-row gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-green-700 transition"
            onClick={(e) => {
              e.preventDefault();
              toast.success("Subscribed successfully!");
            }}
          >
            Subscribe
          </button>
        </form>
      </section>
    </Layout>
  );
}

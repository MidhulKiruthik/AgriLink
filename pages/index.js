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
    if (token) router.push("/products");
    else router.push("/login");
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

        <section className="hero relative w-full h-[60vh] flex flex-col justify-center items-center bg-cover bg-center" style={{ backgroundImage: "url('/images/hero.jpg')" }}>
          <div className="hero-overlay absolute inset-0 bg-black/40"></div>
          <h1 className="relative text-5xl font-bold text-white z-10">
            <span className="brand text-green-400">AgriLink</span>
          </h1>
          <p className="hero-sub relative text-lg text-white mt-2 z-10">
            Your trusted marketplace for fresh & organic produce.
          </p>
        </section>

        <div className="flex justify-center my-8">
          <button
            type="button"
            onClick={handleShopNow}
            className="shop-now-btn px-8 py-3 bg-green-600 text-white font-semibold rounded-full shadow-md hover:bg-green-700 active:scale-95 transition-all duration-300"
          >
            Shop Now
          </button>
        </div>

        <section className="farmers text-center my-16">
          <h2 className="text-2xl font-semibold mb-2">Become a Seller</h2>
          <p className="mb-4">Join AgriLink and start selling your fresh, organic produce to a wide audience.</p>
          <button
            type="button"
            className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-full shadow-md hover:bg-amber-700 active:scale-95 transition-all duration-300"
            onClick={() => router.push("/farmer-dashboard")}
          >
            Become a Seller
          </button>
        </section>

        <section className="testimonials text-center my-16">
          <h2 className="text-2xl font-semibold mb-4">What Our Customers Say</h2>
          <div className="testimonial-cards flex flex-col gap-6 items-center">
            <div className="testimonial-card max-w-md bg-gray-100 p-4 rounded-lg shadow">
              <p>"Great platform! The produce is always fresh and delivered on time."</p>
              <span className="block mt-2 text-sm text-gray-600">- Happy Customer</span>
            </div>
            <div className="testimonial-card max-w-md bg-gray-100 p-4 rounded-lg shadow">
              <p>"As a farmer, AgriLink has helped me reach a broader audience. Highly recommend!"</p>
              <span className="block mt-2 text-sm text-gray-600">- Satisfied Farmer</span>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

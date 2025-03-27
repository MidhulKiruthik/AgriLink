import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  const handleShopNow = () => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/products"); // If logged in, go to products
    } else {
      router.push("/login"); // If not logged in, go to login first
    }
  };

  return (
    <div className="home-container">
      <section className="hero">
        <h1>Welcome to AgriLink</h1>
        <p>Your trusted marketplace for fresh & organic produce.</p>
        <button onClick={handleShopNow}>Shop Now</button>
      </section>

      <section className="featured">
        <h2>Featured Products</h2>
        <div className="product-grid">
          <div className="product-card">🍎 Apples</div>
          <div className="product-card">🥭 Mangoes</div>
          <div className="product-card">🍅 Tomatoes</div>
        </div>
      </section>
    </div>
  );
}

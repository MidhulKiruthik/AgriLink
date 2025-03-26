import Layout from "../components/Layout";

export default function Home() {
  return (
    <Layout>
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "green" }}>Welcome to AgriShop</h1>
        <p style={{ fontSize: "18px", color: "#666" }}>Discover fresh farm products at the best prices!</p>
      </div>
    </Layout>
  );
}

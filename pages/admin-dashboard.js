import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Layout from "../components/Layout";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const checkRoleAndLoad = async () => {
      try {
        // 1) Verify role
        const prof = await axios.get("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const role = prof?.data?.user?.role;
        if (role !== "admin") {
          router.replace("/");
          return;
        }
        setIsAdmin(true);

        // 2) Load products and orders
        const [p, o] = await Promise.all([
          axios.get("/api/products"),
          axios.get("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setProducts(Array.isArray(p.data) ? p.data : []);
        setOrders(Array.isArray(o.data) ? o.data : []);
      } catch (e) {
        console.error(e);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };
    checkRoleAndLoad();
  }, [router]);

  const imgUrl = (image_url) => {
    if (!image_url) return "/uploads/placeholder-product.jpg";
    if (image_url.startsWith("http")) return image_url;
    const cdn = process.env.NEXT_PUBLIC_CDN_URL;
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
    const region = process.env.NEXT_PUBLIC_S3_REGION || "eu-north-1";
    if (image_url.startsWith("/uploads")) {
      if (cdn) return `${cdn}${image_url}`;
      if (bucket) return `https://${bucket}.s3.${region}.amazonaws.com${image_url}`;
      return image_url;
    }
    if (image_url.startsWith("uploads/")) {
      if (cdn) return `${cdn}/${image_url}`;
      if (bucket) return `https://${bucket}.s3.${region}.amazonaws.com/${image_url}`;
    }
    return `/uploads/${image_url}`;
  };

  const deleteProduct = async (id) => {
    const token = localStorage.getItem("token");
    if (!confirm("Delete this product?")) return;
    try {
      await axios.delete(`/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete product");
    }
  };

  const updateOrderStatus = async (id, status) => {
    const token = localStorage.getItem("token");
    setUpdating((u) => ({ ...u, [id]: true }));
    try {
      await axios.put(
        `/api/admin/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating((u) => ({ ...u, [id]: false }));
    }
  };

  if (loading) return <Layout><div style={{ padding: 24 }}>Loading…</div></Layout>;
  if (!isAdmin) return null;

  const statusOptions = ["Pending", "Shipped", "Delivered", "Cancelled", "Paid"];

  return (
    <Layout>
      <div style={{ maxWidth: 1200, margin: "24px auto", padding: 16 }}>
        <h1>Admin Dashboard</h1>
        <p style={{ color: "#666" }}>Manage products and orders</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Products */}
          <section>
            <h2>Products</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {products.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
                  <img src={imgUrl(p.image_url)} alt={p.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>₹{p.price} • Qty {p.quantity}</div>
                  </div>
                  <button onClick={() => router.push(`/products/${p.id}`)}>View</button>
                  <button onClick={() => deleteProduct(p.id)} style={{ color: "#fff", background: "#e11", border: 0, padding: "8px 12px", borderRadius: 6 }}>Delete</button>
                </div>
              ))}
              {products.length === 0 && <div>No products</div>}
            </div>
          </section>

          {/* Orders */}
          <section>
            <h2>Orders</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {orders.map((o) => (
                <div key={o.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Order #{o.id}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{o.customer} • ₹{o.total_price}</div>
                    </div>
                    <div>
                      <select
                        value={o.status}
                        onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                        disabled={!!updating[o.id]}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>{new Date(o.created_at).toLocaleString()}</div>
                </div>
              ))}
              {orders.length === 0 && <div>No orders</div>}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

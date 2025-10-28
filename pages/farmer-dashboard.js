import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function FarmerDashboard() {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
    quantity: "",
    category: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  // No need to store farmerId on client; backend resolves farmer_id from JWT for farmer role
  const [farmerId, setFarmerId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageKey, setImageKey] = useState(null); // S3 object key
  const router = useRouter();

  // Check if token exists; if not, redirect to login (farmer_id not required client-side)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
      } else {
        // farmerId is optional; server derives it from JWT for farmer role
        const fId = localStorage.getItem("farmer_id");
        if (fId) setFarmerId(fId);
      }
    }
  }, [router]);

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProduct({ ...product, image: file });
    setImagePreview(URL.createObjectURL(file));
    setError("");
    setImageKey(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please log in before uploading an image.");
      return;
    }

    try {
      setUploading(true);
      setProgress(5);

      // Derive a safe extension
      const name = file.name || "upload";
      const parts = name.split(".");
      const ext = parts.length > 1 ? parts.pop().toLowerCase().replace(/[^a-z0-9]/g, "") : "";

      // 1) Presign
      const presign = await axios.post(
        "/api/uploads/presign",
        { contentType: file.type, ext },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProgress(20);
      const { url, headers, key } = presign.data || {};
      if (!url || !headers || !key) throw new Error("Invalid presign response");

      // 2) Upload using XHR to get progress events
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100);
            setProgress(Math.max(20, Math.min(90, pct)));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) return resolve();
          reject(new Error(`Upload failed with status ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setProgress(100);
      setImageKey(key); // store S3 object key for submit
    } catch (err) {
      setError(err?.message || "Failed to upload image to S3.");
      setImageKey(null);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Unauthorized! Please log in.");
      return;
    }
    try {
      setError("");
      if (!imageKey) {
        setError("Image upload to S3 not completed. Please select an image and wait for upload to finish.");
        return;
      }
      await axios.post(
        "/api/products",
        {
          name: product.name,
          price: product.price,
          description: product.description,
          quantity: product.quantity,
          category: product.category,
          image_key: imageKey,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Product added successfully!");
      router.push("/farmer-dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to add product.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Add New Product</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          onChange={handleChange}
          required
          style={styles.input}
        />
        <textarea
          name="description"
          placeholder="Product Description"
          onChange={handleChange}
          required
          style={styles.input}
        ></textarea>
        <input
          type="number"
          name="price"
          placeholder="Price"
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="category"
          placeholder="Category"
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          required
          style={styles.input}
        />
        {imagePreview && (
          <img src={imagePreview} alt="Preview" style={styles.preview} />
        )}
        {uploading && (
          <div style={{ width: "100%", height: 6, background: "#eee", borderRadius: 4 }}>
            <div style={{ height: 6, background: "#28a745", borderRadius: 4, width: `${progress}%`, transition: "width .3s ease" }} />
          </div>
        )}
        <button type="submit" style={styles.button} disabled={uploading}>{uploading ? "Uploading..." : "Add Product"}</button>
        <button type="button" onClick={() => router.push("/products")} style={styles.viewButton}>
          View Products
        </button>
        <button onClick={() => router.push("/signup")} style={styles.viewButton}>
          Join us
        </button>
      </form>
    </div>
  );
}const styles = {
  viewButton: {
    padding: "10px 24px",
    backgroundColor: "#0066ff",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "20px",
    transition: "background 0.3s ease",
  },
  container: {
    maxWidth: "420px",
    margin: "60px auto",
    padding: "25px 30px",
    borderRadius: "15px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
    textAlign: "center",
    backgroundColor: "#fdfdfd",
  },
  title: {
    fontSize: "26px",
    marginBottom: "20px",
    fontWeight: "600",
    color: "#333",
  },
  error: {
    color: "#d32f2f",
    marginBottom: "12px",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  input: {
    padding: "12px 15px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    fontSize: "16px",
    outlineColor: "#007bff",
  },
  button: {
    padding: "12px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background 0.3s ease",
  },
  preview: {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "8px",
    marginTop: "10px",
    border: "1px solid #ccc",
  },
};

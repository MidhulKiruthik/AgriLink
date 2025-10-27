import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function AddProduct() {
  const [product, setProduct] = useState({
    name: "",
    price: "",
    description: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageKey, setImageKey] = useState(null); // S3 object key returned by presign/upload
  const router = useRouter();

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
            // scale from 20..90 during upload
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
      console.error(err);
      setError(err?.message || "Failed to upload image to S3.");
      setImageKey(null);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to log in first!");
        return;
      }
      setError("");
      // Require S3 upload to be completed
      if (!imageKey) {
        setError("Image upload to S3 not completed. Please select an image and wait for the upload to finish.");
        return;
      }
      await axios.post(
        "/api/products",
        {
          name: product.name,
          price: product.price,
          description: product.description,
          quantity: product.quantity || 1,
          category: product.category || "",
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
      <h2>Add a New Product</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} style={styles.form}>
        <input type="text" name="name" placeholder="Product Name" onChange={handleChange} required style={styles.input} />
        <input type="number" name="price" placeholder="Price" onChange={handleChange} required style={styles.input} />
        <textarea name="description" placeholder="Description" onChange={handleChange} required style={styles.input}></textarea>

        {/* File Upload for Image */}
        <input type="file" accept="image/*" onChange={handleFileChange} required style={styles.input} />
        {imagePreview && <img src={imagePreview} alt="Preview" style={styles.preview} />}
        {uploading && (
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressBar, width: `${progress}%` }} />
          </div>
        )}
        <button type="submit" style={styles.button} disabled={uploading}>{uploading ? "Uploading..." : "Add Product"}</button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: "400px", margin: "50px auto", padding: "20px", textAlign: "center" },
  error: { color: "red" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: { padding: "10px", border: "1px solid #ccc", borderRadius: "5px" },
  button: { padding: "10px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "5px" },
  preview: { width: "100px", height: "100px", objectFit: "cover", marginTop: "10px" },
  progressWrap: { width: "100%", height: 6, background: "#eee", borderRadius: 4 },
  progressBar: { height: 6, background: "#28a745", borderRadius: 4, transition: "width .3s ease" },
};

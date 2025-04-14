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
  const [farmerId, setFarmerId] = useState(null);
  const router = useRouter();

  // Check if token and farmer_id exist; if not, redirect to login
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const fId = localStorage.getItem("farmer_id");
      if (!token || !fId) {
        router.push("/login");
      } else {
        setFarmerId(fId);
      }
    }
  }, [router]);

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct({ ...product, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token"); // Get JWT Token

    if (!token) {
      setError("Unauthorized! Please log in.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", product.name);
      formData.append("description", product.description);
      formData.append("price", product.price);
      formData.append("quantity", product.quantity);
      formData.append("category", product.category);
      formData.append("image", product.image);
      formData.append("farmer_id", farmerId);

      await axios.post("http://localhost:5000/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Product added successfully!");
      router.push("/farmer-dashboard");
    } catch (err) {
      console.error("Error:", err.response ? err.response.data : err.message);
      setError("Join us to sell Products!");
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
        <button type="submit" style={styles.button}>
          Add Product
        </button>
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

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
  const router = useRouter();

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct({ ...product, image: file });
      setImagePreview(URL.createObjectURL(file)); // Show image preview
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("image", product.image);

      // Upload image
      const uploadRes = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Submit product data with uploaded image URL
      await axios.post("http://localhost:5000/products", {
        ...product,
        imageUrl: uploadRes.data.imageUrl,
      });

      alert("Product added successfully!");
      router.push("/farmer-dashboard");
    } catch (err) {
      setError("Failed to add product.");
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

        <button type="submit" style={styles.button}>Add Product</button>
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
};

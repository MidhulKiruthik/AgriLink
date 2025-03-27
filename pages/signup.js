import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "customer", // Default role
  });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); // Clear errors

    try {
      await axios.post("http://localhost:5000/signup", formData);
      alert("Signup successful! Please login.");
      router.push("/login"); // Redirect to login page
    } catch (err) {
      setError("Signup failed! Please check your details.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Create an Account</h2>

      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleSignup} style={styles.form}>
        <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required style={styles.input} />
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required style={styles.input} />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required style={styles.input} />
        <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required style={styles.input} />
        <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} required style={styles.input} />

        <label style={styles.label}>Role:</label>
        <select name="role" value={formData.role} onChange={handleChange} style={styles.select}>
          <option value="customer">Customer</option>
          <option value="farmer">Farmer</option>
        </select>

        <button type="submit" style={styles.button}>Sign Up</button>
      </form>

      <p style={styles.loginText}>
        Already have an account? <a href="/login" style={styles.link}>Login here</a>
      </p>
    </div>
  );
}

// 🔹 Inline CSS Styling
const styles = {
  container: {
    maxWidth: "400px",
    margin: "50px auto",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 0 15px rgba(0, 0, 0, 0.2)",
    textAlign: "center",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: "24px",
    marginBottom: "15px",
  },
  error: {
    color: "red",
    marginBottom: "10px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  input: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    fontSize: "16px",
  },
  label: {
    textAlign: "left",
    marginTop: "5px",
    fontWeight: "bold",
  },
  select: {
    padding: "10px",
    borderRadius: "5px",
    fontSize: "16px",
  },
  button: {
    padding: "10px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
  },
  loginText: {
    marginTop: "10px",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
  },
};

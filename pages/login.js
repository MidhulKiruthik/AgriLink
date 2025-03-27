import { useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const res = await axios.post("http://localhost:5000/login", { email, password });
      localStorage.setItem("token", res.data.token); // Store token
      router.push("/products"); // Redirect to products page
    } catch (err) {
      setError("Invalid email or password!"); // Show error message
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Login</h2>

      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Login</button>
      </form>

      <p style={styles.registerText}>
        Don't have an account? <a href="/signup" style={styles.link}>Sign Up</a>
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
  button: {
    padding: "10px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
  },
  registerText: {
    marginTop: "10px",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
  },
};

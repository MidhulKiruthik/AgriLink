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
  const [validationErrors, setValidationErrors] = useState({});
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const errors = {};
    // Email validation (basic format check)
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }
    // Phone number validation (basic check)
    if (!formData.phone || formData.phone.length < 10) {
      errors.phone = "Phone number must be at least 10 digits.";
    }
    // Password validation (min length check)
    if (!formData.password || formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }
    // Name validation (required)
    if (!formData.name) {
      errors.name = "Full Name is required.";
    }
    // Address validation (required)
    if (!formData.address) {
      errors.address = "Address is required.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0; // If no errors, return true
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); // Clear any previous errors
  
    if (!validate()) {
      return; // Stop if validation fails
    }
  
    try {
      await axios.post("http://localhost:5000/signup", formData);
      alert("Signup successful! Redirecting...");
  
      if (formData.role === "farmer") {
        router.push("/farmer-dashboard"); // Redirect farmers to a dedicated dashboard
      } else {
        router.push("/login"); // Redirect customers to the product page
      }
    } catch (err) {
      setError("Signup failed! Please check your details.");
    }
  };
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Create an Account</h2>

      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleSignup} style={styles.form}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          style={styles.input}
        />
        {validationErrors.name && <span style={styles.error}>{validationErrors.name}</span>}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          style={styles.input}
        />
        {validationErrors.email && <span style={styles.error}>{validationErrors.email}</span>}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          style={styles.input}
        />
        {validationErrors.password && <span style={styles.error}>{validationErrors.password}</span>}

        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
          style={styles.input}
        />
        {validationErrors.phone && <span style={styles.error}>{validationErrors.phone}</span>}

        <input
          type="text"
          name="address"
          placeholder="Address"
          value={formData.address}
          onChange={handleChange}
          required
          style={styles.input}
        />
        {validationErrors.address && <span style={styles.error}>{validationErrors.address}</span>}

        <label style={styles.label}>Role:</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          style={styles.select}
        >
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
    fontSize: "14px",
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

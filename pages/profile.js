import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

import Layout from "../components/Layout";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    
    try {  const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to log in first!");
        window.location.href = "/login"; // Redirect to login page
        return;
      }

      const res = await axios.get("http://localhost:5000/profile", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUser(res.data.user);
    } catch (error) {
      setError("Failed to load profile.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove token
    router.push("/login"); // Redirect to login
  };
  return (
    <Layout>
    <div style={styles.container}>
      <h2 style={styles.heading}>Your Profile</h2>
  
      {error && <p style={styles.error}>{error}</p>}
  
      {user ? (
        <div style={styles.profileCard}>
          <p style={styles.profileText}>
            <span style={styles.profileLabel}>Name:</span> {user.name}
          </p>
          <p style={styles.profileText}>
            <span style={styles.profileLabel}>Email:</span> {user.email}
          </p>
          <p style={styles.profileText}>
            <span style={styles.profileLabel}>Role:</span> {user.role}
          </p>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <p style={styles.loading}>Loading...</p>
      )}
    </div> </Layout>
);
}
  const styles = {
    container: {
      maxWidth: "500px",
      margin: "50px auto",
      padding: "30px",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      textAlign: "center",
      backgroundColor: "#fff",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    heading: {
      fontSize: "28px",
      marginBottom: "20px",
      color: "#2c3e50",
      fontWeight: "600",
    },
    profileCard: {
      padding: "25px",
      borderRadius: "10px",
      backgroundColor: "#f8fafc",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
      marginTop: "20px",
      textAlign: "left",
    },
    profileText: {
      margin: "12px 0",
      fontSize: "16px",
      color: "#34495e",
      lineHeight: "1.6",
    },
    profileLabel: {
      fontWeight: "600",
      color: "#2c3e50",
      marginRight: "8px",
    },
    error: {
      color: "#e74c3c",
      margin: "15px 0",
      padding: "10px",
      backgroundColor: "#fde8e8",
      borderRadius: "6px",
      fontSize: "14px",
    },
    loading: {
      color: "#7f8c8d",
      fontSize: "16px",
      margin: "20px 0",
    },
    logoutBtn: {
      marginTop: "20px",
      padding: "10px 20px",
      backgroundColor: "#e74c3c",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "15px",
      fontWeight: "500",
      transition: "all 0.2s ease",
      width: "100%",
      ":hover": {
        backgroundColor: "#c0392b",
        transform: "translateY(-1px)",
      },
      ":active": {
        transform: "translateY(0)",
      },
    },
  };
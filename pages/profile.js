import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
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
    <div style={styles.container}>
      <h2 style={styles.heading}>Your Profile</h2>

      {error && <p style={styles.error}>{error}</p>}

      {user ? (
        <div style={styles.profileCard}>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "400px",
    margin: "40px auto",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: "24px",
    marginBottom: "10px",
  },
  profileCard: {
    padding: "15px",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  },
  error: {
    color: "red",
    marginBottom: "10px",
  },
  logoutBtn: {
    marginTop: "10px",
    padding: "8px 12px",
    backgroundColor: "#ff4d4d",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../api";
import { toast } from "react-toastify";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || name.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (!username || username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    if (!password || password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({
        name,
        username,
        email,
        phone: phone ? parseInt(phone) : null,
        password,
        role,
      });
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (error) {
      if (error.response?.data?.errors) {
        Object.values(error.response.data.errors).forEach((err) =>
          toast.error(err)
        );
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/assets/Kasoti logo.png" alt="Kasoti" className="auth-logo-img" />
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Get started with Kasoti</p>

        <form className="auth-form" onSubmit={handleRegister}>
          <div className="auth-field">
            <label className="auth-label">Full Name</label>
            <input
              type="text"
              className="auth-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Username</label>
            <input
              type="text"
              className="auth-input"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Phone (optional)</label>
            <input
              type="tel"
              className="auth-input"
              placeholder="1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              placeholder="Min 8 chars, uppercase, number, special"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">I am a</label>
            <div className="role-toggle">
              <button
                type="button"
                className={`role-option ${role === "STUDENT" ? "active" : ""}`}
                onClick={() => setRole("STUDENT")}
              >
                Student
              </button>
              <button
                type="button"
                className={`role-option ${role === "TEACHER" ? "active" : ""}`}
                onClick={() => setRole("TEACHER")}
              >
                Teacher
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

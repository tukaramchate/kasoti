import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../api";
import { toast } from "react-toastify";
import { UserContext } from "../../context/UserContext";
import "./Login.css";

const Login = () => {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset password state
  const [showReset, setShowReset] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(username, password);
      const userData = {
        token: response.data.token,
        user: response.data.user,
      };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      toast.success("Login successful!");
      navigate("/home");
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          toast.error("Invalid username or password");
        } else if (error.response.data?.errors) {
          Object.values(error.response.data.errors).forEach((err) =>
            toast.error(err)
          );
        } else {
          toast.error(error.response.data?.message || "Login failed");
        }
      } else {
        toast.error("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail);
      toast.success("Reset link sent! Check your email.");
      setShowForgot(false);
      setShowReset(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken.trim()) {
      toast.error("Please enter the reset token");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setResetLoading(true);
    try {
      await authAPI.resetPassword(resetToken.trim(), newPassword);
      toast.success("Password reset! You can now sign in.");
      setShowReset(false);
      setResetToken("");
      setNewPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/assets/Kasoti logo.png" alt="Kasoti" className="auth-logo-img" />
        </div>

        {/* Forgot Password Form */}
        {showForgot && (
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">Enter your email to receive a reset link</p>
            <form className="auth-form" onSubmit={handleForgotPassword}>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="auth-btn" disabled={forgotLoading}>
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <div className="auth-footer">
              <button className="auth-link-btn" onClick={() => setShowForgot(false)}>
                Back to sign in
              </button>
            </div>
          </>
        )}

        {/* Reset Password Form */}
        {showReset && (
          <>
            <h1 className="auth-title">Reset password</h1>
            <p className="auth-subtitle">Enter the token from your email and a new password</p>
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="auth-field">
                <label className="auth-label">Reset Token</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Paste token from email"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label className="auth-label">New Password</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="auth-btn" disabled={resetLoading}>
                {resetLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
            <div className="auth-footer">
              <button className="auth-link-btn" onClick={() => { setShowReset(false); setShowForgot(false); }}>
                Back to sign in
              </button>
            </div>
          </>
        )}

        {/* Login Form */}
        {!showForgot && !showReset && (
          <>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your account to continue</p>

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="auth-field">
                <label className="auth-label">Username</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="auth-forgot-link">
                <button type="button" className="auth-link-btn" onClick={() => setShowForgot(true)}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account? <Link to="/register">Create one</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;

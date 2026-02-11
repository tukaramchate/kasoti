import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/UserContext";
import PasswordInput from "../../components/PasswordInput";

const Login = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

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

  const inputStyles = "w-full py-[11px] px-[14px] font-sans text-sm text-[color:var(--text-primary)] bg-[color:var(--bg-input)] border border-[color:var(--border)] rounded outline-none transition-all duration-150 focus:border-[color:var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-light)] placeholder:text-[color:var(--text-muted)]";
  const buttonStyles = "w-full py-3 bg-[color:var(--accent)] text-white border-none rounded font-sans text-sm font-semibold cursor-pointer transition-all duration-150 mt-1 hover:bg-[color:var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed";
  const linkBtnStyles = "bg-none border-none text-[color:var(--accent)] font-sans text-[13px] font-medium cursor-pointer p-0 transition-all duration-150 hover:text-[color:var(--accent-hover)] hover:underline";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] p-6">
      <div className="w-full max-w-[420px] bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl p-10 shadow">
        <div className="flex items-center justify-center mb-8">
          <img src="/assets/kasoti-logo.png" alt="Kasoti" className="h-14 rounded object-contain" />
        </div>

        {showForgot && (
          <>
            <h1 className="text-[22px] font-bold text-[color:var(--text-primary)] mb-1">Forgot password?</h1>
            <p className="text-[color:var(--text-secondary)] text-sm mb-7">Enter your email to receive a reset link</p>
            <form className="flex flex-col gap-4" onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Email</label>
                <input
                  type="email"
                  className={inputStyles}
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <button type="submit" className={buttonStyles} disabled={forgotLoading}>
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <div className="text-center mt-6 text-sm text-[color:var(--text-secondary)]">
              <button className={linkBtnStyles} onClick={() => setShowForgot(false)}>
                Back to sign in
              </button>
            </div>
          </>
        )}

        {showReset && (
          <>
            <h1 className="text-[22px] font-bold text-[color:var(--text-primary)] mb-1">Reset password</h1>
            <p className="text-[color:var(--text-secondary)] text-sm mb-7">Enter the token from your email and a new password</p>
            <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Reset Token</label>
                <input
                  type="text"
                  className={inputStyles}
                  placeholder="Paste token from email"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[color:var(--text-primary)]">New Password</label>
                <PasswordInput
                  className={inputStyles}
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button type="submit" className={buttonStyles} disabled={resetLoading}>
                {resetLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
            <div className="text-center mt-6 text-sm text-[color:var(--text-secondary)]">
              <button className={linkBtnStyles} onClick={() => { setShowReset(false); setShowForgot(false); }}>
                Back to sign in
              </button>
            </div>
          </>
        )}

        {!showForgot && !showReset && (
          <>
            <h1 className="text-[22px] font-bold text-[color:var(--text-primary)] mb-1">Welcome back</h1>
            <p className="text-[color:var(--text-secondary)] text-sm mb-7">Sign in to your account to continue</p>

            <form className="flex flex-col gap-4" onSubmit={handleLogin}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Username</label>
                <input
                  type="text"
                  className={inputStyles}
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Password</label>
                <PasswordInput
                  className={inputStyles}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="text-right -mt-2">
                <button type="button" className={linkBtnStyles} onClick={() => setShowForgot(true)}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className={buttonStyles} disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="text-center mt-6 text-sm text-[color:var(--text-secondary)]">
              Don't have an account? <Link to="/register" className="font-medium text-[color:var(--accent)] hover:text-[color:var(--accent-hover)]">Create one</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;

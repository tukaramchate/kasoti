import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authAPI } from "../../api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/UserContext";
import PasswordInput from "../../components/PasswordInput";
import { motion, AnimatePresence } from "framer-motion";
import { inputStyles, primaryButtonStyles, ghostButtonStyles } from "../../utils/styles";

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -20, scale: 0.96, transition: { duration: 0.25 } },
};

const fieldVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
};

const Login = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
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
    if (!username || !password) { toast.error("Please enter username and password"); return; }
    setLoading(true);
    try {
      const response = await authAPI.login(username, password);
      setUser({ token: response.data.token, user: response.data.user });
      toast.success("Login successful!");
      navigate(redirectTo || "/home");
    } catch (error) {
      if (error.response?.status === 401) toast.error("Invalid username or password");
      else if (error.response?.data?.errors) Object.values(error.response.data.errors).forEach((err) => toast.error(err));
      else toast.error(error.response?.data?.message || "Login failed");
      if (!error.response) toast.error("Network error. Please check your connection.");
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) { toast.error("Please enter a valid email"); return; }
    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail);
      toast.success("Reset link sent! Check your email.");
      setShowForgot(false); setShowReset(true);
    } catch (error) { toast.error(error.response?.data?.message || "Failed to send reset email"); }
    finally { setForgotLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken.trim()) { toast.error("Please enter the reset token"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setResetLoading(true);
    try {
      await authAPI.resetPassword(resetToken.trim(), newPassword);
      toast.success("Password reset! You can now sign in.");
      setShowReset(false); setResetToken(""); setNewPassword("");
    } catch (error) { toast.error(error.response?.data?.message || "Failed to reset password"); }
    finally { setResetLoading(false); }
  };

  const currentView = showForgot ? "forgot" : showReset ? "reset" : "login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[color:var(--accent)] rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-15 animate-blob animation-delay-2000" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-[420px] bg-[color:var(--bg-card)]/80 backdrop-blur-2xl border border-[color:var(--border)] rounded-2xl p-10 shadow-glass relative z-10"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center mb-8"
          >
            <img src="/assets/kasoti-logo.png" alt="Kasoti" className="h-14 rounded object-contain" />
          </motion.div>

          {/* Forgot Password Form */}
          {showForgot && (
            <>
              <h1 className="text-[22px] font-bold text-[color:var(--text-primary)] mb-1">Forgot password?</h1>
              <p className="text-[color:var(--text-secondary)] text-sm mb-7">Enter your email to receive a reset link</p>
              <form className="flex flex-col gap-4" onSubmit={handleForgotPassword}>
                <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Email</label>
                  <input type="email" className={inputStyles} placeholder="Enter your email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                </motion.div>
                <motion.button custom={1} variants={fieldVariants} initial="hidden" animate="visible" type="submit" className={primaryButtonStyles} disabled={forgotLoading}>
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </motion.button>
              </form>
              <div className="text-center mt-6 text-sm text-[color:var(--text-secondary)]">
                <button className={ghostButtonStyles} onClick={() => setShowForgot(false)}>Back to sign in</button>
              </div>
            </>
          )}

          {/* Reset Password Form */}
          {showReset && (
            <>
              <h1 className="text-[22px] font-bold text-[color:var(--text-primary)] mb-1">Reset password</h1>
              <p className="text-[color:var(--text-secondary)] text-sm mb-7">Enter the token from your email and a new password</p>
              <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
                <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Reset Token</label>
                  <input type="text" className={inputStyles} placeholder="Paste token from email" value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
                </motion.div>
                <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--text-primary)]">New Password</label>
                  <PasswordInput className={inputStyles} placeholder="Min 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </motion.div>
                <motion.button custom={2} variants={fieldVariants} initial="hidden" animate="visible" type="submit" className={primaryButtonStyles} disabled={resetLoading}>
                  {resetLoading ? "Resetting..." : "Reset Password"}
                </motion.button>
              </form>
              <div className="text-center mt-6 text-sm text-[color:var(--text-secondary)]">
                <button className={ghostButtonStyles} onClick={() => { setShowReset(false); setShowForgot(false); }}>Back to sign in</button>
              </div>
            </>
          )}

          {/* Login Form */}
          {!showForgot && !showReset && (
            <>
              <motion.h1 custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="text-[22px] font-bold text-[color:var(--text-primary)] mb-1">Welcome back</motion.h1>
              <motion.p custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="text-[color:var(--text-secondary)] text-sm mb-7">Sign in to your account to continue</motion.p>

              <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Username</label>
                  <input type="text" className={inputStyles} placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </motion.div>

                <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Password</label>
                  <PasswordInput className={inputStyles} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </motion.div>

                <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="text-right -mt-2">
                  <button type="button" className={ghostButtonStyles} onClick={() => setShowForgot(true)}>Forgot password?</button>
                </motion.div>

                <motion.button custom={5} variants={fieldVariants} initial="hidden" animate="visible" type="submit" className={primaryButtonStyles} disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </motion.button>
              </form>

              <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible" className="text-center mt-6 text-sm text-[color:var(--text-secondary)]">
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accent-hover)]">Create one</Link>
              </motion.div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Login;

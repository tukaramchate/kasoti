import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/UserContext";
import PasswordInput from "../../components/PasswordInput";
import { motion } from "framer-motion";
import { inputStyles, primaryButtonStyles } from "../../utils/styles";

const fieldVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
};

const Register = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({ fullName: "", username: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
      toast.error("Please fill all required fields"); return;
    }
    if (formData.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const response = await authAPI.register({
        name: formData.fullName, username: formData.username, email: formData.email,
        phone: formData.phone || null, password: formData.password, role: "STUDENT",
      });
      if (response.data?.token) {
        setUser({ token: response.data.token, user: response.data.user });
        toast.success("Registration successful! Welcome! 🎉");
        navigate("/home");
      } else {
        toast.success("Registration successful! Please sign in.");
        navigate("/login");
      }
    } catch (error) {
      if (error.response?.data?.errors) Object.values(error.response.data.errors).forEach((err) => toast.error(err));
      else toast.error(error.response?.data?.message || "Registration failed");
      if (!error.response) toast.error("Network error. Please check your connection.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[color:var(--accent)] rounded-full mix-blend-multiply filter blur-[100px] opacity-15 animate-blob" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] bg-[color:var(--bg-card)]/80 backdrop-blur-2xl border border-[color:var(--border)] rounded-2xl p-10 shadow-glass relative z-10"
      >
        {/* Logo */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="flex items-center justify-center mb-8">
          <img src="/assets/kasoti-logo.png" alt="Kasoti" className="h-14 rounded object-contain" />
        </motion.div>

        <motion.h1 custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="text-[22px] font-bold text-[color:var(--text-primary)] mb-1">Create account</motion.h1>
        <motion.p custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="text-[color:var(--text-secondary)] text-sm mb-7">Fill in your details to get started</motion.p>

        <form className="flex flex-col gap-4" onSubmit={handleRegister}>
          {[
            { label: "Full Name *", name: "fullName", type: "text", placeholder: "Enter your full name" },
            { label: "Username *", name: "username", type: "text", placeholder: "Choose a username" },
            { label: "Email *", name: "email", type: "email", placeholder: "Enter your email" },
            { label: "Phone (optional)", name: "phone", type: "tel", placeholder: "Enter your phone number" },
          ].map((field, i) => (
            <motion.div key={field.name} custom={i + 2} variants={fieldVariants} initial="hidden" animate="visible" className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-[color:var(--text-primary)]">{field.label}</label>
              <input type={field.type} name={field.name} className={inputStyles} placeholder={field.placeholder}
                value={formData[field.name]} onChange={handleChange} />
            </motion.div>
          ))}

          <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible" className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Password *</label>
            <PasswordInput name="password" className={inputStyles} placeholder="Min 8 characters" value={formData.password} onChange={handleChange} />
          </motion.div>

          <motion.p custom={7} variants={fieldVariants} initial="hidden" animate="visible" className="text-xs text-[color:var(--text-muted)]">
            Registering as a <span className="font-semibold text-[color:var(--text-primary)]">Student</span>. Need a teacher account? Contact your administrator.
          </motion.p>

          <motion.button custom={8} variants={fieldVariants} initial="hidden" animate="visible" type="submit" className={primaryButtonStyles} disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </motion.button>
        </form>

        <motion.div custom={9} variants={fieldVariants} initial="hidden" animate="visible" className="text-center mt-6 text-sm text-[color:var(--text-secondary)]">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[color:var(--accent)] hover:text-[color:var(--accent-hover)]">Sign in</Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;

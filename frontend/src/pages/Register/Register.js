import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "../../api";
import { toast } from "react-toastify";
import PasswordInput from "../../components/PasswordInput";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await authAPI.register({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone || null,
        password: formData.password,
        role: role,
      });
      toast.success("Registration successful! Please sign in.");
      navigate("/login");
    } catch (error) {
      if (error.response) {
        if (error.response.data?.errors) {
          Object.values(error.response.data.errors).forEach((err) =>
            toast.error(err)
          );
        } else {
          toast.error(error.response.data?.message || "Registration failed");
        }
      } else {
        toast.error("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyles = "w-full py-[11px] px-[14px] font-sans text-sm text-[color:var(--text-primary)] bg-[color:var(--bg-input)] border border-[color:var(--border)] rounded outline-none transition-all duration-150 focus:border-[color:var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-light)] placeholder:text-[color:var(--text-muted)]";
  const buttonStyles = "w-full py-3 bg-[color:var(--accent)] text-white border-none rounded font-sans text-sm font-semibold cursor-pointer transition-all duration-150 mt-1 hover:bg-[color:var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] p-6">
      <div className="w-full max-w-[420px] bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl p-10 shadow">
        <div className="flex items-center justify-center mb-8">
          <img src="/assets/kasoti-logo.png" alt="Kasoti" className="h-14 rounded object-contain" />
        </div>

        <h1 className="text-[22px] font-bold text-[color:var(--text-primary)] mb-1">Create account</h1>
        <p className="text-[color:var(--text-secondary)] text-sm mb-7">Fill in your details to get started</p>

        <form className="flex flex-col gap-4" onSubmit={handleRegister}>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Full Name *</label>
            <input
              type="text"
              name="fullName"
              className={inputStyles}
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Username *</label>
            <input
              type="text"
              name="username"
              className={inputStyles}
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Email *</label>
            <input
              type="email"
              name="email"
              className={inputStyles}
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Phone (optional)</label>
            <input
              type="tel"
              name="phone"
              className={inputStyles}
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[color:var(--text-primary)]">Password *</label>
            <PasswordInput
              name="password"
              className={inputStyles}
              placeholder="Min 8 characters"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[color:var(--text-primary)]">I am a...</label>
            <div className="flex gap-2">
              <button
                type="button"
                className={`flex-1 py-2.5 border rounded font-medium text-sm transition-all duration-150 ${
                  role === "STUDENT"
                    ? "bg-[color:var(--accent)] text-white border-[color:var(--accent)]"
                    : "bg-transparent text-[color:var(--text-secondary)] border-[color:var(--border)] hover:border-[color:var(--accent)]"
                }`}
                onClick={() => setRole("STUDENT")}
              >
                Student
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 border rounded font-medium text-sm transition-all duration-150 ${
                  role === "TEACHER"
                    ? "bg-[color:var(--accent)] text-white border-[color:var(--accent)]"
                    : "bg-transparent text-[color:var(--text-secondary)] border-[color:var(--border)] hover:border-[color:var(--accent)]"
                }`}
                onClick={() => setRole("TEACHER")}
              >
                Teacher
              </button>
            </div>
          </div>

          <button type="submit" className={buttonStyles} disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-[color:var(--text-secondary)]">
          Already have an account? <Link to="/login" className="font-medium text-[color:var(--accent)] hover:text-[color:var(--accent-hover)]">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "./api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style/Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isTeacher, setTeacher] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!username || username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return false;
    }
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email");
      return false;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authAPI.register({
        email,
        username,
        phone: phone ? parseInt(phone) : null,
        password,
        is_teacher: isTeacher,
      });

      console.log("Registration successful:", response.data);
      toast.success("Registration successful! Please login.");
      navigate("/");
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        Object.values(errors).forEach(err => toast.error(err));
      } else {
        console.error(error);
        toast.error("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="parent">
        <div className="left">
          <div className="column-1">
            <img
              className="logo"
              src="assets/2.png"
              alt="Description of the logo"
            />
            <span className="span">
              <h1 className="text">Sign up to </h1>
              <h2 className="text">Our Webpage Quiz project </h2>
              <div className="Paragraphs">
                <p className="div-1">If you already have an account</p>
                <p className="div-2">
                  You can <Link to="/">Login here!</Link>
                </p>
              </div>
            </span>
          </div>
          <div className="column-2">
            <img
              loading="lazy"
              src="assets/1.png"
              className="img"
              alt="Human"
            />
          </div>
        </div>
        <div className="right">
          <h1 className="div-3">Sign up</h1>
          <input
            type="text"
            className="data"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="text"
            className="data"
            placeholder="Create a username (min 3 characters)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="text"
            className="data"
            placeholder="Phone number (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            type="password"
            className="pass"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="teacher-checkbox">
            <label>
              <input
                type="checkbox"
                checked={isTeacher}
                onChange={() => setTeacher(!isTeacher)}
              />
              Are you a teacher?
            </label>
          </div>
          <button className="register" onClick={handleRegister} disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};
export default Register;


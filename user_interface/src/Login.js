import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "./api";
import { ToastContainer, toast } from "react-toastify";
import { UserContext } from "./userContext";
import "react-toastify/dist/ReactToastify.css";
import "./style/Login.css";

const Login = () => {
  const { setUser } = useContext(UserContext);

  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error("Please enter username and password");
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login(username, password);

      // Store user data with token
      const userData = {
        token: response.data.token,
        user: response.data.user
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      console.log("Login successful:", response.data);
      toast.success("Login successful!");
      navigate("/home");
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          toast.error("Invalid username or password");
        } else if (error.response.status === 400) {
          toast.error(error.response.data.message || "Invalid input");
        } else {
          console.error("Login error:", error.response.data);
          toast.error("An error occurred during login. Please try again later.");
        }
      } else {
        toast.error("Network error. Please check your connection.");
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
              <h1 className="text">Sign in to </h1>
              <h2 className="text">Our Webpage Quiz project </h2>
              <div className="Paragraphs">
                <p className="div-1">If you don't have an account</p>
                <p className="div-2">
                  You can <Link to="/register">Register here!</Link>
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
          <h1 className="div-3">Sign in</h1>
          <input
            type="text"
            className="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="pass"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          />

          <button className="login" onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};
export default Login;


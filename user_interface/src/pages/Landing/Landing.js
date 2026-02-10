import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { FiEdit3, FiCheckCircle, FiBarChart2, FiUserPlus, FiBookOpen, FiAward, FiMoon, FiSun } from "react-icons/fi";
import "./Landing.css";

const Landing = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  if (user) return null;

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <img src="/assets/Kasoti logo.png" alt="Kasoti" className="landing-nav-logo" />
          <div className="landing-nav-actions">
            <button className="landing-theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
            <Link to="/login" className="landing-nav-btn landing-nav-btn--outline">
              Login
            </Link>
            <Link to="/register" className="landing-nav-btn landing-nav-btn--primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <h1 className="landing-hero-title">
              Prove What<br />You <span>Know</span>
            </h1>
            <p className="landing-hero-subtitle">
              The interactive quiz platform for students and teachers.
              Create, share, and take quizzes with instant results and leaderboards.
            </p>
            <div className="landing-hero-actions">
              <Link to="/register" className="landing-btn landing-btn--primary">
                Get Started Free
              </Link>
              <Link to="/login" className="landing-btn landing-btn--outline">
                Sign In
              </Link>
            </div>
          </div>
          <div className="landing-hero-visual">
            <img src="/assets/1.png" alt="Student using Kasoti" className="landing-hero-img" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Everything you need</h2>
          <p className="landing-section-subtitle">
            Built for classrooms, study groups, and self-learners
          </p>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <FiEdit3 />
              </div>
              <h3>Create Quizzes</h3>
              <p>Teachers can build quizzes with multiple-choice questions, set time limits, and publish with a single click.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <FiCheckCircle />
              </div>
              <h3>Take Quizzes</h3>
              <p>Students attempt quizzes and get instant results with score breakdowns and time tracking.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <FiBarChart2 />
              </div>
              <h3>Track Progress</h3>
              <p>Leaderboards, analytics dashboards, and quiz history help you measure growth over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-steps">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">How it works</h2>
          <p className="landing-section-subtitle">Get started in three simple steps</p>
          <div className="landing-steps-grid">
            <div className="landing-step">
              <div className="landing-step-number">
                <FiUserPlus />
              </div>
              <h3>Sign Up</h3>
              <p>Create a free account as a student or teacher in seconds.</p>
            </div>
            <div className="landing-step-divider"></div>
            <div className="landing-step">
              <div className="landing-step-number">
                <FiBookOpen />
              </div>
              <h3>Create or Browse</h3>
              <p>Teachers build quizzes. Students browse and pick a quiz to attempt.</p>
            </div>
            <div className="landing-step-divider"></div>
            <div className="landing-step">
              <div className="landing-step-number">
                <FiAward />
              </div>
              <h3>Score & Compete</h3>
              <p>Get instant results, climb the leaderboard, and track your progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-section-inner">
          <h2 className="landing-cta-title">Ready to prove what you know?</h2>
          <p className="landing-cta-subtitle">Join Kasoti and start your learning journey today.</p>
          <Link to="/register" className="landing-btn landing-btn--primary landing-btn--lg">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-top">
            <div className="landing-footer-left">
              <img src="/assets/Kasoti logo.png" alt="Kasoti" className="landing-footer-logo" />
              <p className="landing-footer-tagline">
                The interactive quiz platform built for classrooms and self-learners.
              </p>
            </div>
            <div className="landing-footer-links">
              <div className="landing-footer-col">
                <h4>Platform</h4>
                <Link to="/register">Create Account</Link>
                <Link to="/login">Sign In</Link>
              </div>
              <div className="landing-footer-col">
                <h4>Features</h4>
                <span>Quiz Builder</span>
                <span>Leaderboards</span>
                <span>Analytics</span>
              </div>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <div className="landing-footer-college-wrap">
              <span className="landing-footer-built">A project of</span>
              <img src="/assets/2.png" alt="GH Raisoni College" className="landing-footer-college" />
            </div>
            <p className="landing-footer-copy">&copy; {new Date().getFullYear()} Kasoti. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

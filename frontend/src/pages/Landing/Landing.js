import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { FiEdit3, FiCheckCircle, FiBarChart2, FiUserPlus, FiBookOpen, FiAward, FiMoon, FiSun } from "react-icons/fi";

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { darkMode, toggleTheme } = useTheme();

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  if (user) return null;

  return (
    <div className="min-h-screen bg-[color:var(--bg-primary)] text-[color:var(--text-primary)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[color:var(--bg-card)] border-b border-[color:var(--border)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
          <img src="/assets/kasoti-logo.png" alt="Kasoti" className="h-9 rounded-sm object-contain" />
          <div className="flex items-center gap-2.5">
            <button
              className="w-9 h-9 bg-transparent border border-[color:var(--border)] rounded cursor-pointer text-[color:var(--text-secondary)] text-base flex items-center justify-center transition-all duration-150 hover:bg-[color:var(--bg-hover)] hover:text-[color:var(--text-primary)]"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </button>
            <Link
              to="/login"
              className="hidden sm:inline-block px-[18px] py-2 rounded text-[13px] font-semibold no-underline transition-all duration-150 text-[color:var(--text-secondary)] border border-[color:var(--border)] bg-transparent hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-[18px] py-2 rounded text-[13px] font-semibold no-underline transition-all duration-150 bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-hover)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto flex items-center gap-12 flex-col md:flex-row text-center md:text-left">
          <div className="flex-1 min-w-0">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-[18px]">
              Prove What<br />You <span className="text-[color:var(--accent)]">Know</span>
            </h1>
            <p className="text-base md:text-[17px] leading-relaxed text-[color:var(--text-secondary)] mb-8 max-w-[460px] mx-auto md:mx-0">
              The interactive quiz platform for students and teachers.
              Create, share, and take quizzes with instant results and leaderboards.
            </p>
            <div className="flex gap-3 flex-wrap justify-center md:justify-start">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-7 py-3 rounded text-sm font-semibold no-underline transition-all duration-150 bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-hover)]"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-7 py-3 rounded text-sm font-semibold no-underline transition-all duration-150 bg-transparent text-[color:var(--text-primary)] border border-[color:var(--border)] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                Sign In
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center justify-center">
            <img src="/assets/1.png" alt="Student using Kasoti" className="w-60 md:w-[340px] max-w-full h-auto drop-shadow-lg" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-[72px] bg-[color:var(--bg-secondary)] border-y border-[color:var(--border)]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-[22px] md:text-[28px] font-bold text-[color:var(--text-primary)] mb-2">Everything you need</h2>
          <p className="text-[15px] text-[color:var(--text-secondary)] mb-10">
            Built for classrooms, study groups, and self-learners
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[400px] md:max-w-none mx-auto">
            {[
              { icon: <FiEdit3 />, title: "Create Quizzes", desc: "Teachers can build quizzes with multiple-choice questions, set time limits, and publish with a single click." },
              { icon: <FiCheckCircle />, title: "Take Quizzes", desc: "Students attempt quizzes and get instant results with score breakdowns and time tracking." },
              { icon: <FiBarChart2 />, title: "Track Progress", desc: "Leaderboards, analytics dashboards, and quiz history help you measure growth over time." },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-[color:var(--bg-card)] border border-[color:var(--border)] rounded-xl py-8 px-6 text-center transition-all duration-150 hover:border-[color:var(--accent-subtle)] hover:shadow hover:-translate-y-0.5"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-[color:var(--accent-light)] text-[color:var(--accent)] rounded-lg flex items-center justify-center text-[22px]">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-[color:var(--text-primary)] mb-2">{feature.title}</h3>
                <p className="text-[13px] leading-relaxed text-[color:var(--text-secondary)]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-[72px]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-[22px] md:text-[28px] font-bold text-[color:var(--text-primary)] mb-2">How it works</h2>
          <p className="text-[15px] text-[color:var(--text-secondary)] mb-10">Get started in three simple steps</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            {[
              { icon: <FiUserPlus />, title: "Sign Up", desc: "Create a free account as a student or teacher in seconds." },
              { icon: <FiBookOpen />, title: "Create or Browse", desc: "Teachers build quizzes. Students browse and pick a quiz to attempt." },
              { icon: <FiAward />, title: "Score & Compete", desc: "Get instant results, climb the leaderboard, and track your progress." },
            ].map((step, idx, arr) => (
              <React.Fragment key={idx}>
                <div className="flex-1 max-w-[260px] text-center px-4">
                  <div className="w-[52px] h-[52px] mx-auto mb-4 bg-[color:var(--accent)] text-white rounded-full flex items-center justify-center text-[22px]">
                    {step.icon}
                  </div>
                  <h3 className="text-[15px] font-semibold text-[color:var(--text-primary)] mb-1.5">{step.title}</h3>
                  <p className="text-[13px] leading-relaxed text-[color:var(--text-secondary)]">{step.desc}</p>
                </div>
                {idx < arr.length - 1 && (
                  <div className="hidden md:block w-[60px] h-0.5 bg-[color:var(--border)] mt-[26px] flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[color:var(--bg-secondary)] border-y border-[color:var(--border)] text-center">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-[22px] md:text-[26px] font-bold text-[color:var(--text-primary)] mb-2">Ready to prove what you know?</h2>
          <p className="text-[15px] text-[color:var(--text-secondary)] mb-7">Join Kasoti and start your learning journey today.</p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-9 py-3.5 rounded text-[15px] font-semibold no-underline transition-all duration-150 bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent-hover)]"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[color:var(--bg-card)] border-t border-[color:var(--border)] px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 py-10 pb-8">
            <div className="max-w-full md:max-w-[300px]">
              <img src="/assets/kasoti-logo.png" alt="Kasoti" className="h-8 rounded-sm object-contain mb-3" />
              <p className="text-[13px] leading-relaxed text-[color:var(--text-muted)]">
                The interactive quiz platform built for classrooms and self-learners.
              </p>
            </div>
            <div className="flex gap-10 md:gap-14">
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-primary)] mb-1">Platform</h4>
                <Link to="/register" className="text-[13px] text-[color:var(--text-secondary)] no-underline transition-all duration-150 hover:text-[color:var(--accent)]">Create Account</Link>
                <Link to="/login" className="text-[13px] text-[color:var(--text-secondary)] no-underline transition-all duration-150 hover:text-[color:var(--accent)]">Sign In</Link>
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-primary)] mb-1">Features</h4>
                <span className="text-[13px] text-[color:var(--text-secondary)]">Quiz Builder</span>
                <span className="text-[13px] text-[color:var(--text-secondary)]">Leaderboards</span>
                <span className="text-[13px] text-[color:var(--text-secondary)]">Analytics</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between py-5 border-t border-[color:var(--border-light)] gap-3 text-center">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-[color:var(--text-muted)] whitespace-nowrap">A project of</span>
              <img src="/assets/2.png" alt="GH Raisoni College" className="h-9 object-contain" />
            </div>
            <p className="text-xs text-[color:var(--text-muted)]">&copy; {new Date().getFullYear()} Kasoti. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

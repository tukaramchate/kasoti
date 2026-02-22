import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { FiMoon, FiSun, FiLogOut, FiHome, FiGrid, FiShield } from "react-icons/fi";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const currentUser = user?.user;
  const isTeacher = currentUser?.role === "TEACHER" || currentUser?.is_teacher;
  const isAdmin = currentUser?.role === "ADMIN";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-[color:var(--bg-card)]/95 backdrop-blur-md border-b border-[color:var(--border)]">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
        {/* Left: Logo */}
        <Link to="/home" className="flex items-center gap-2 no-underline shrink-0">
          <img
            src="/assets/kasoti-logo.png"
            alt="Kasoti"
            className="h-8 rounded-sm object-contain"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Home */}
          <Link
            to="/home"
            className="flex items-center gap-1.5 py-2 px-2.5 sm:px-3 text-[color:var(--text-secondary)] no-underline text-[13px] font-medium rounded-lg transition-all duration-150 hover:bg-[color:var(--bg-hover)] hover:text-[color:var(--text-primary)]"
          >
            <FiHome size={15} />
            <span className="hidden sm:inline">Home</span>
          </Link>

          {/* Dashboard (Teachers) */}
          {isTeacher && (
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 py-2 px-2.5 sm:px-3 text-[color:var(--text-secondary)] no-underline text-[13px] font-medium rounded-lg transition-all duration-150 hover:bg-[color:var(--bg-hover)] hover:text-[color:var(--text-primary)]"
            >
              <FiGrid size={15} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}

          {/* Admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 py-2 px-2.5 sm:px-3 text-[color:var(--text-secondary)] no-underline text-[13px] font-medium rounded-lg transition-all duration-150 hover:bg-[color:var(--bg-hover)] hover:text-[color:var(--text-primary)]"
            >
              <FiShield size={15} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Theme toggle */}
          <button
            className="w-9 h-9 bg-transparent border border-[color:var(--border)] rounded-lg cursor-pointer text-[color:var(--text-secondary)] text-base flex items-center justify-center transition-all duration-150 hover:bg-[color:var(--bg-hover)] hover:text-[color:var(--text-primary)]"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {darkMode ? <FiSun size={15} /> : <FiMoon size={15} />}
          </button>

          {/* Profile avatar */}
          {currentUser && (
            <button
              className="flex items-center gap-2 py-1.5 px-2 sm:px-2.5 rounded-lg cursor-pointer transition-all duration-150 hover:bg-[color:var(--bg-hover)] bg-transparent border-none"
              onClick={() => navigate("/profile")}
            >
              <div className="w-[30px] h-[30px] bg-[color:var(--accent)] rounded-full flex items-center justify-center text-white font-semibold text-[13px] shrink-0">
                {currentUser.username?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline text-[color:var(--text-primary)] font-medium text-[13px]">
                {currentUser.username}
              </span>
            </button>
          )}

          {/* Logout */}
          <button
            className="flex items-center gap-1.5 py-2 px-2.5 sm:px-3 bg-transparent border border-[color:var(--border)] text-[color:var(--text-secondary)] rounded-lg font-medium text-[13px] cursor-pointer transition-all duration-150 hover:bg-[color:var(--danger-light)] hover:text-[color:var(--danger)] hover:border-[color:var(--danger)]"
            onClick={handleLogout}
          >
            <FiLogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

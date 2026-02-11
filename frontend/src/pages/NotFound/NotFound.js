import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/UserContext";

const NotFound = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl font-extrabold text-[color:var(--accent)] mb-4">404</div>
        <h1 className="text-2xl font-bold text-[color:var(--text-primary)] mb-2">Page not found</h1>
        <p className="text-[color:var(--text-secondary)] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to={user ? "/home" : "/"}
          className="inline-flex items-center justify-center px-6 py-3 bg-[color:var(--accent)] text-white rounded-lg font-medium text-sm no-underline transition-all hover:bg-[color:var(--accent-hover)]"
        >
          {user ? "Go to Home" : "Go to Landing"}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

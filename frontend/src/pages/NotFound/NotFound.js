import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/UserContext";
import { motion } from "framer-motion";
import { FiHome, FiArrowLeft } from "react-icons/fi";

const NotFound = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg-primary)] p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-[color:var(--accent)] rounded-full mix-blend-multiply filter blur-[130px] opacity-20 animate-blob" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full mix-blend-multiply filter blur-[110px] opacity-15 animate-blob animation-delay-2000" />
      </div>

      <div className="text-center max-w-md relative z-10">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.1 }}
          className="text-[120px] md:text-[160px] font-extrabold leading-none mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[color:var(--accent)] to-purple-500 select-none"
          style={{ filter: "drop-shadow(0 0 40px rgba(var(--accent-rgb, 99, 102, 241), 0.3))" }}
        >
          404
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold text-[color:var(--text-primary)] mb-3"
        >
          Page not found
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-[color:var(--text-secondary)] mb-10 text-[16px] leading-relaxed"
        >
          The page you're looking for doesn't exist or has been moved.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Link
            to={user ? "/home" : "/"}
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[color:var(--accent)] to-purple-600 text-white rounded-xl font-semibold text-[15px] no-underline transition-all duration-300 hover:shadow-glow hover:-translate-y-1"
          >
            {user ? <FiHome className="group-hover:scale-110 transition-transform" /> : <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />}
            {user ? "Go to Home" : "Back to Landing"}
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;

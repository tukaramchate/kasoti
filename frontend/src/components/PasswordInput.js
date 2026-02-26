import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const PasswordInput = ({ className = "", ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={showPassword ? "text" : "password"}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-[color:var(--text-muted)] cursor-pointer p-0 flex items-center justify-center hover:text-[color:var(--text-secondary)] transition-colors"
        onClick={() => setShowPassword((prev) => !prev)}
        tabIndex={-1}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
      </button>
    </div>
  );
};

export default PasswordInput;

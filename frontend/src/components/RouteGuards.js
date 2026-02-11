import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserContext } from "../context/UserContext";

/**
 * Protects routes that require authentication.
 * Redirects to /login if not authenticated.
 */
export const ProtectedRoute = ({ children }) => {
  const { user } = useContext(UserContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * Protects routes that require specific roles.
 * Redirects to /home with no access if role doesn't match.
 */
export const RoleGuard = ({ children, roles = [] }) => {
  const { user } = useContext(UserContext);
  const currentUser = user?.user;
  const userRole = currentUser?.role;
  const isTeacher = currentUser?.is_teacher;

  // Check if user has required role
  const hasAccess = roles.some((role) => {
    if (role === "TEACHER") return userRole === "TEACHER" || isTeacher;
    if (role === "ADMIN") return userRole === "ADMIN";
    return userRole === role;
  });

  if (!hasAccess) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

/**
 * Prevents authenticated users from accessing guest-only pages (login, register).
 * Redirects to /home if already logged in.
 */
export const GuestRoute = ({ children }) => {
  const { user } = useContext(UserContext);

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

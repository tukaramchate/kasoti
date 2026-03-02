package com.tukaram.kasoti.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory rate limiter for authentication endpoints.
 * Limits requests to MAX_REQUESTS per TIME_WINDOW_MS per IP address.
 * Uses AtomicInteger for count to prevent race conditions under concurrent requests.
 */
public class RateLimitFilter implements Filter {

    private final ConcurrentHashMap<String, RateLimitInfo> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS = 30;
    private static final long TIME_WINDOW_MS = 60000; // 1 minute
    private final java.util.concurrent.atomic.AtomicInteger requestCounter = new java.util.concurrent.atomic.AtomicInteger(0);
    private static final int CLEANUP_INTERVAL = 100; // cleanup every 100 requests

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String clientIP = getClientIP(httpRequest);

        // compute() is atomic per-key, and AtomicInteger.incrementAndGet() is thread-safe
        RateLimitInfo info = requestCounts.compute(clientIP, (key, existing) -> {
            long now = System.currentTimeMillis();
            if (existing == null || now - existing.windowStart > TIME_WINDOW_MS) {
                return new RateLimitInfo(now);
            }
            existing.count.incrementAndGet(); // ✅ thread-safe atomic increment
            return existing;
        });

        if (info.count.get() > MAX_REQUESTS) {
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setStatus(429); // Too Many Requests
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write(
                    "{\"status\": 429, \"message\": \"Too many requests. Please try again later.\"}");
            return;
        }

        chain.doFilter(request, response);

        // Periodic cleanup to prevent unbounded map growth
        if (requestCounter.incrementAndGet() % CLEANUP_INTERVAL == 0) {
            cleanup();
        }
    }

    /**
     * Get client IP — only uses remoteAddr to prevent X-Forwarded-For spoofing.
     */
    private String getClientIP(HttpServletRequest request) {
        // Do NOT trust X-Forwarded-For from unknown sources — it can be spoofed.
        // Only use request.getRemoteAddr() which is set by the servlet container.
        return request.getRemoteAddr();
    }

    /**
     * Remove expired entries to prevent unbounded memory growth.
     */
    public void cleanup() {
        long now = System.currentTimeMillis();
        requestCounts.entrySet().removeIf(entry ->
                now - entry.getValue().windowStart > TIME_WINDOW_MS * 2);
    }

    private static class RateLimitInfo {
        final long windowStart;
        final AtomicInteger count; // ✅ was plain int — race condition fixed

        RateLimitInfo(long windowStart) {
            this.windowStart = windowStart;
            this.count = new AtomicInteger(1);
        }
    }
}

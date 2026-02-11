package com.tukaram.kasoti.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory rate limiter for authentication endpoints.
 * Limits requests to 10 per minute per IP address.
 */
public class RateLimitFilter implements Filter {

    private final ConcurrentHashMap<String, RateLimitInfo> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS = 10;
    private static final long TIME_WINDOW_MS = 60000; // 1 minute

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String clientIP = getClientIP(httpRequest);

        RateLimitInfo info = requestCounts.compute(clientIP, (key, existing) -> {
            long now = System.currentTimeMillis();
            if (existing == null || now - existing.windowStart > TIME_WINDOW_MS) {
                return new RateLimitInfo(now, 1);
            }
            existing.count++;
            return existing;
        });

        if (info.count > MAX_REQUESTS) {
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setStatus(429); // Too Many Requests
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write(
                    "{\"status\": 429, \"message\": \"Too many requests. Please try again later.\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    /**
     * Get client IP, considering X-Forwarded-For header for proxied requests.
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class RateLimitInfo {
        long windowStart;
        int count;

        RateLimitInfo(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}

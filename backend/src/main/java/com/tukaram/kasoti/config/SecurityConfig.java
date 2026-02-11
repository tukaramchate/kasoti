package com.tukaram.kasoti.config;

import com.tukaram.kasoti.security.JwtAuthFilter;
import com.tukaram.kasoti.security.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Rate limiting filter for auth endpoints - prevents brute force attacks.
     */
    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilter() {
        FilterRegistrationBean<RateLimitFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new RateLimitFilter());
        registrationBean.addUrlPatterns("/api/auth/*");
        registrationBean.setOrder(1); // Run first
        return registrationBean;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/health/**",
                                "/api/public/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/quizzes/share/**", "/api/quizzes/**").permitAll()

                        // Admin only endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Teacher + Admin endpoints (General)
                        .requestMatchers(
                                "/api/quizzes/*/publish",
                                "/api/quizzes/*/close",
                                "/api/quizzes/*/students",
                                "/api/quizzes/my",
                                "/api/dashboard/**")
                        .hasAnyRole("ADMIN", "TEACHER")

                        // Teacher + Admin endpoints (Method Specific)
                        .requestMatchers(HttpMethod.POST, "/api/quizzes").hasAnyRole("ADMIN", "TEACHER")
                        .requestMatchers(HttpMethod.PUT, "/api/quizzes/**").hasAnyRole("ADMIN", "TEACHER")
                        .requestMatchers(HttpMethod.DELETE, "/api/quizzes/**").hasAnyRole("ADMIN", "TEACHER")

                        // Protected endpoints - any authenticated user
                        .requestMatchers(
                                "/api/profile/**",
                                "/api/quizzes/*/attempted")
                        .authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/quizzes/*/submit").authenticated()

                        // Default - require authentication
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173"));

        // Add any extra origins from environment variable
        String extraOrigins = System.getenv("CORS_ALLOWED_ORIGINS");
        if (extraOrigins != null && !extraOrigins.isBlank()) {
            for (String origin : extraOrigins.split(",")) {
                configuration.addAllowedOrigin(origin.trim());
            }
        }

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

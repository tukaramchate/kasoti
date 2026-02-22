package com.tukaram.kasoti.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private int serverPort;

    @Bean
    public OpenAPI kasotiOpenAPI() {
        final String securitySchemeName = "Bearer Authentication";

        return new OpenAPI()
                .info(new Info()
                        .title("Kasoti Quiz API")
                        .description("""
                                RESTful API for the Kasoti Quiz Platform.
                                
                                **Authentication:** Most endpoints require a JWT token. 
                                Obtain one via `/api/auth/login` or `/api/auth/register`, 
                                then click the **Authorize** button and enter: `Bearer <your-token>`
                                
                                **Roles:**
                                - **STUDENT** — Browse quizzes, submit attempts, view profile
                                - **TEACHER** — Create/manage quizzes, view dashboard & student results
                                - **ADMIN** — Full system access, user management, system stats
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Tukaram Chate")
                                .url("https://github.com/tukaramchate/kasoti"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Local Development Server")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter your JWT token (without 'Bearer ' prefix)")))
                .tags(List.of(
                        new Tag().name("Authentication").description("Register, login, and password management"),
                        new Tag().name("Quizzes").description("Quiz CRUD, publishing, sharing, and submission"),
                        new Tag().name("Dashboard").description("Teacher dashboard statistics"),
                        new Tag().name("Profile").description("User profile and attempt history"),
                        new Tag().name("Admin").description("Admin-only user & quiz management"),
                        new Tag().name("Categories").description("Quiz categories and tags"),
                        new Tag().name("Health").description("Service health checks"),
                        new Tag().name("Public").description("Unauthenticated public endpoints")));
    }
}

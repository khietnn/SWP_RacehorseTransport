package com.swp.racehorse.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    OpenAPI openApi() { return new OpenAPI().info(new Info().title("Racehorse Transport API").version("0.0.1")); }
}

package com.swp.racehorse;

import com.swp.racehorse.config.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
class ApplicationContextTest {
    @Autowired JwtService jwt;

    @Test
    void contextLoadsAndJwtRoundTrips() {
        assertEquals("a@x.vn", jwt.parse(jwt.generate("a@x.vn", "CUSTOMER")).getSubject());
    }
}

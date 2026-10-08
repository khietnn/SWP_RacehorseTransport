package com.swp.racehorse.service;

import com.swp.racehorse.dto.request.HorseRequest;
import com.swp.racehorse.dto.request.HorseUpdateRequest;
import com.swp.racehorse.entity.Sex;
import com.swp.racehorse.exception.BusinessException;
import com.swp.racehorse.exception.NotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class HorseServiceTest {
    @Autowired HorseService service;

    HorseRequest req(String chip) {
        return new HorseRequest("Thunder", chip, "Thoroughbred", Sex.STALLION, "Nâu", 2018, "Đốm trán");
    }

    @Test
    void createNormalizesMicrochip() {
        var h = service.create("a@x.vn", req("  vn123  "));
        assertEquals("VN123", h.microchip());
    }

    @Test
    void duplicateMicrochipRejected() {
        service.create("a@x.vn", req("VN1"));
        assertThrows(BusinessException.class, () -> service.create("b@x.vn", req("vn1")));
    }

    @Test
    void microchipCannotBeChanged() {
        var h = service.create("a@x.vn", req("VN2"));
        var patch = new HorseUpdateRequest(null, "VN9", null, null, null, null, null);
        assertThrows(BusinessException.class, () -> service.update("a@x.vn", h.id(), patch));
    }

    @Test
    void otherOwnerSeesNotFound() {
        var h = service.create("a@x.vn", req("VN3"));
        assertThrows(NotFoundException.class, () -> service.get("b@x.vn", h.id()));
    }
}

package com.swp.racehorse.mapper;

import com.swp.racehorse.dto.response.HorseResponse;
import com.swp.racehorse.entity.Horse;
import org.springframework.stereotype.Component;

@Component
public class HorseMapper {
    public HorseResponse toResponse(Horse h) {
        return new HorseResponse(h.getId(), h.getOwner(), h.getName(), h.getMicrochip(), h.getBreed(), h.getSex(),
                h.getColor(), h.getBirthYear(), h.getMarks(), h.getCompletedTrips(), h.getCreatedAt());
    }
}

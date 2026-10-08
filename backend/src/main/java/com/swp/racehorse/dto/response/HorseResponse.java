package com.swp.racehorse.dto.response;

import com.swp.racehorse.entity.Sex;

import java.time.Instant;

public record HorseResponse(Long id, String owner, String name, String microchip, String breed, Sex sex,
                            String color, int birthYear, String marks, int completedTrips, Instant createdAt) {}

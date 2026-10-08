package com.swp.racehorse.dto.request;

import com.swp.racehorse.entity.Sex;
import jakarta.validation.constraints.*;

public record HorseRequest(
        @NotBlank String name, @NotBlank String microchip, @NotBlank String breed,
        @NotNull Sex sex, String color, @Min(1980) int birthYear, String marks) {}

package com.swp.racehorse.dto.request;

import com.swp.racehorse.entity.Sex;

/** Mọi trường tùy chọn; microchip chỉ để bị từ chối nếu khác bản đã lưu. */
public record HorseUpdateRequest(String name, String microchip, String breed, Sex sex, String color, Integer birthYear, String marks) {}

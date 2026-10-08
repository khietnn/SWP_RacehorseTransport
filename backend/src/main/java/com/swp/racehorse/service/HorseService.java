package com.swp.racehorse.service;

import com.swp.racehorse.dto.request.HorseRequest;
import com.swp.racehorse.dto.request.HorseUpdateRequest;
import com.swp.racehorse.dto.response.HorseResponse;

import java.util.List;

public interface HorseService {
    List<HorseResponse> list(String owner);
    HorseResponse get(String owner, Long id);
    HorseResponse create(String owner, HorseRequest request);
    HorseResponse update(String owner, Long id, HorseUpdateRequest request);
}

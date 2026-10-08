package com.swp.racehorse.controller;

import com.swp.racehorse.common.ApiResponse;
import com.swp.racehorse.dto.request.HorseRequest;
import com.swp.racehorse.dto.request.HorseUpdateRequest;
import com.swp.racehorse.dto.response.HorseResponse;
import com.swp.racehorse.service.HorseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Module mẫu: nhóm BE lặp lại mẫu này cho Booking, Trip, Incident, Account... */
@RestController
@RequestMapping("/api/horses")
@RequiredArgsConstructor
public class HorseController {
    private final HorseService service;

    @GetMapping
    public ApiResponse<List<HorseResponse>> list(@RequestParam String owner) { return ApiResponse.ok(service.list(owner)); }

    @GetMapping("/{id}")
    public ApiResponse<HorseResponse> get(@PathVariable Long id, @RequestParam String owner) { return ApiResponse.ok(service.get(owner, id)); }

    @PostMapping
    public ApiResponse<HorseResponse> create(@RequestParam String owner, @Valid @RequestBody HorseRequest body) { return ApiResponse.ok(service.create(owner, body)); }

    @PatchMapping("/{id}")
    public ApiResponse<HorseResponse> update(@PathVariable Long id, @RequestParam String owner, @RequestBody HorseUpdateRequest body) { return ApiResponse.ok(service.update(owner, id, body)); }
}

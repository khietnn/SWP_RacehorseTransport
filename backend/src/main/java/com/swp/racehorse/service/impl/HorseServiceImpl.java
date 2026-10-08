package com.swp.racehorse.service.impl;

import com.swp.racehorse.dto.request.HorseRequest;
import com.swp.racehorse.dto.request.HorseUpdateRequest;
import com.swp.racehorse.dto.response.HorseResponse;
import com.swp.racehorse.entity.Horse;
import com.swp.racehorse.exception.BusinessException;
import com.swp.racehorse.exception.NotFoundException;
import com.swp.racehorse.mapper.HorseMapper;
import com.swp.racehorse.repository.HorseRepository;
import com.swp.racehorse.service.HorseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class HorseServiceImpl implements HorseService {
    private final HorseRepository repo;
    private final HorseMapper mapper;

    private static String normalizeChip(String s) { return s.trim().toUpperCase(Locale.ROOT); }

    @Override @Transactional(readOnly = true)
    public List<HorseResponse> list(String owner) { return repo.findByOwner(owner).stream().map(mapper::toResponse).toList(); }

    @Override @Transactional(readOnly = true)
    public HorseResponse get(String owner, Long id) { return mapper.toResponse(find(owner, id)); }

    @Override
    public HorseResponse create(String owner, HorseRequest r) {
        var chip = normalizeChip(r.microchip());
        if (chip.isEmpty()) throw new BusinessException("Cần nhập mã microchip.");
        if (repo.existsByMicrochip(chip)) throw new BusinessException("Microchip " + chip + " đã có trong hệ thống.");
        var h = new Horse();
        h.setOwner(owner); h.setName(r.name()); h.setMicrochip(chip); h.setBreed(r.breed()); h.setSex(r.sex());
        h.setColor(r.color()); h.setBirthYear(r.birthYear()); h.setMarks(r.marks());
        return mapper.toResponse(repo.save(h));
    }

    @Override
    public HorseResponse update(String owner, Long id, HorseUpdateRequest r) {
        var h = find(owner, id);
        if (r.microchip() != null && !normalizeChip(r.microchip()).equals(h.getMicrochip()))
            throw new BusinessException("Không sửa được mã microchip sau khi đã lưu.");
        if (r.name() != null) h.setName(r.name());
        if (r.breed() != null) h.setBreed(r.breed());
        if (r.sex() != null) h.setSex(r.sex());
        if (r.color() != null) h.setColor(r.color());
        if (r.birthYear() != null) h.setBirthYear(r.birthYear());
        if (r.marks() != null) h.setMarks(r.marks());
        return mapper.toResponse(repo.save(h));
    }

    private Horse find(String owner, Long id) {
        return repo.findByIdAndOwner(id, owner).orElseThrow(() -> new NotFoundException("Không tìm thấy ngựa."));
    }
}

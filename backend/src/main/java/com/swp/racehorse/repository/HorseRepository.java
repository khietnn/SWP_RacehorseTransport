package com.swp.racehorse.repository;

import com.swp.racehorse.entity.Horse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HorseRepository extends JpaRepository<Horse, Long> {
    List<Horse> findByOwner(String owner);
    Optional<Horse> findByIdAndOwner(Long id, String owner);
    boolean existsByMicrochip(String microchip);
}

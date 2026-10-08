package com.swp.racehorse.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter @Setter @NoArgsConstructor
@Entity
@Table(name = "horses", uniqueConstraints = @UniqueConstraint(columnNames = "microchip"))
public class Horse {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String owner;
    @Column(nullable = false) private String name;
    @Column(nullable = false, updatable = false) private String microchip; // khóa định danh, không sửa sau khi lưu
    @Column(nullable = false) private String breed;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private Sex sex;
    private String color;
    private int birthYear;
    private String marks;
    private int completedTrips;
    @Column(nullable = false, updatable = false) private Instant createdAt = Instant.now();
}

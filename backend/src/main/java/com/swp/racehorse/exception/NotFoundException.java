package com.swp.racehorse.exception;

/** Không tìm thấy dữ liệu (trả 404). */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) { super(message); }
}

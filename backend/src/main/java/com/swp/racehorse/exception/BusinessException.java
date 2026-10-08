package com.swp.racehorse.exception;

/** Lỗi nghiệp vụ (trả 400). */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) { super(message); }
}

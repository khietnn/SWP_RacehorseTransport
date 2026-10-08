package com.swp.racehorse.common;

import java.util.List;

/** Định dạng response chung của mọi API. */
public record ApiResponse<T>(boolean success, T data, String message, List<String> errors) {
    public static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(true, data, null, List.of()); }
    public static <T> ApiResponse<T> fail(String message, List<String> errors) { return new ApiResponse<>(false, null, message, errors); }
}

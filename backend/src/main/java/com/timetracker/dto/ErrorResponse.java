package com.timetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {
    private LocalDateTime timestamp;
    private String code;
    private String message;
    private Map<String, String> details;
    private String traceId;

    public static ErrorResponse of(String code, String message, String traceId) {
        return ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .code(code)
            .message(message)
            .traceId(traceId)
            .build();
    }

    public static ErrorResponse of(String code, String message, Map<String, String> details, String traceId) {
        return ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .code(code)
            .message(message)
            .details(details)
            .traceId(traceId)
            .build();
    }
}

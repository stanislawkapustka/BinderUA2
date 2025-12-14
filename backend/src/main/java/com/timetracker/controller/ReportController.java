package com.timetracker.controller;

import com.timetracker.dto.ReportDto;
import com.timetracker.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/monthly")
    public ResponseEntity<ReportDto> getMonthlyReport(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(defaultValue = "PLN") String currency) {
        
        if (userId == null) {
            throw new RuntimeException("User ID is required");
        }

        ReportDto report = reportService.generateMonthlyReport(userId, year, month, currency);
        return ResponseEntity.ok(report);
    }
}

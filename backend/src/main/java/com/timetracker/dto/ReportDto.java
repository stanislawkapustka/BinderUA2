package com.timetracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportDto {
    private Long id;
    private Long userId;
    private Integer year;
    private Integer month;
    private List<TimeEntryDto> items;
    private ReportTotals totals;
    private String currency;
    private RateInfo rateInfo;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReportTotals {
        private BigDecimal totalHours;
        private BigDecimal totalCost;
        private String formattedCost;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RateInfo {
        private BigDecimal plToUahRate;
        private String source;
        private String updatedAt;
    }
}

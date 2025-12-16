package com.timetracker.service;

import com.timetracker.dto.ReportDto;
import com.timetracker.dto.TimeEntryDto;
import com.timetracker.entity.TimeEntry;
import com.timetracker.entity.User;
import com.timetracker.repository.TimeEntryRepository;
import com.timetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for generating monthly cost reports with automatic currency conversion.
 * Implements contract-specific cost calculation formulas:
 * - UoP (Umowa o Pracę): totalHours * (monthlyGrossRate / 160)
 * - B2B: totalHours * hourlyNetRate
 * Supports currency conversion (PLN, UAH, USD) and locale-specific formatting.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final TimeEntryRepository timeEntryRepository;
    private final UserRepository userRepository;
    private final CurrencyService currencyService;

    // Standard monthly working hours for UoP cost calculation (default: 160)
    @Value("${binderua.rates.monthly-hours:160}")
    private int monthlyHours;

    // Currency conversion rate from PLN to UAH (configurable in application.yml)
    @Value("${binderua.rates.pl-to-uah}")
    private BigDecimal plToUahRate;

    /**
     * Generate a comprehensive monthly report for a user including all time entries and cost calculations.
     * Calculates total hours worked and total cost based on user's contract type (UoP or B2B).
     * Converts currency if requested and formats according to locale.
     *
     * @param userId ID of user to generate report for
     * @param year Report year (e.g., 2025)
     * @param month Report month (1-12)
     * @param currency Desired currency for report (PLN, UAH, USD)
     * @return Complete monthly report with entries, totals, and rate information
     * @throws RuntimeException if user not found
     */
    public ReportDto generateMonthlyReport(Long userId, int year, int month, String currency) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<TimeEntry> entries = timeEntryRepository.findByUserIdAndYearAndMonth(userId, year, month);
        
        List<TimeEntryDto> entryDtos = entries.stream()
                .map(TimeEntryDto::from)
                .collect(Collectors.toList());

        BigDecimal totalHours = entries.stream()
                .map(TimeEntry::getTotalHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCostPLN = calculateTotalCost(user, entries);
        BigDecimal totalCostConverted = convertCurrency(totalCostPLN, currency);

        ReportDto.ReportTotals totals = ReportDto.ReportTotals.builder()
                .totalHours(totalHours)
                .totalCost(totalCostConverted)
                .formattedCost(currencyService.formatCurrency(totalCostConverted, getCurrencyLanguage(currency)))
                .build();

        ReportDto.RateInfo rateInfo = ReportDto.RateInfo.builder()
                .plToUahRate(plToUahRate)
                .source("config")
                .updatedAt(java.time.LocalDateTime.now().toString())
                .build();

        return ReportDto.builder()
                .userId(userId)
                .year(year)
                .month(month)
                .items(entryDtos)
                .totals(totals)
                .currency(currency)
                .rateInfo(rateInfo)
                .build();
    }

    /**
     * Calculate total cost based on user's contract type and rates.
     * 
     * UoP calculation: totalHours * (monthlyGrossRate / monthly Hours)
     * Example: 35 hours * (6000 PLN / 160) = 1312.50 PLN
     * 
     * B2B calculation: totalHours * hourlyNetRate
     * Example: 35 hours * 120 PLN = 4200 PLN
     *
     * @param user User entity with contract type and rates
     * @param entries List of time entries to calculate cost for
     * @return Total cost in PLN (base currency)
     */
    private BigDecimal calculateTotalCost(User user, List<TimeEntry> entries) {
        BigDecimal totalHours = entries.stream()
                .map(TimeEntry::getTotalHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (user.getContractType() == User.ContractType.UOP && user.getUopGrossRate() != null) {
            // UoP: Calculate hourly rate by dividing monthly rate by standard hours (160)
            // Then multiply by actual hours worked
            BigDecimal hourlyRate = user.getUopGrossRate()
                    .divide(BigDecimal.valueOf(monthlyHours), 2, RoundingMode.HALF_UP);
            return totalHours.multiply(hourlyRate);
        } else if (user.getContractType() == User.ContractType.B2B && user.getB2bHourlyNetRate() != null) {
            // B2B: Simple multiplication of hours by hourly rate
            return totalHours.multiply(user.getB2bHourlyNetRate());
        }

        return BigDecimal.ZERO;
    }

    /**
     * Convert amount from PLN to requested currency using configured exchange rates.
     * Note: USD conversion uses simplified rate (1 PLN = 0.25 USD) - should use actual rate in production.
     *
     * @param amountPLN Amount in PLN (base currency)
     * @param currency Target currency (PLN, UAH, USD)
     * @return Converted amount in target currency
     */
    private BigDecimal convertCurrency(BigDecimal amountPLN, String currency) {
        if ("UAH".equalsIgnoreCase(currency)) {
            return currencyService.convertPLNtoUAH(amountPLN);
        } else if ("USD".equalsIgnoreCase(currency)) {
            // Simplified USD conversion (would use actual rate in production)
            return amountPLN.divide(BigDecimal.valueOf(4.0), 2, RoundingMode.HALF_UP);
        }
        // Default to PLN (no conversion)
        return amountPLN;
    }

    /**
     * Map currency code to appropriate language locale for formatting.
     * Used to determine which currency formatting rules to apply.
     *
     * @param currency Currency code (PLN, UAH, USD)
     * @return Language code for formatting (PL, UA, EN)
     */
    private String getCurrencyLanguage(String currency) {
        switch (currency.toUpperCase()) {
            case "UAH":
                return "UA";
            case "USD":
                return "EN";
            default:
                return "PL";
        }
    }
}

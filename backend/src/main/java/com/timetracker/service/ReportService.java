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

@Service
@RequiredArgsConstructor
public class ReportService {

    private final TimeEntryRepository timeEntryRepository;
    private final UserRepository userRepository;
    private final CurrencyService currencyService;

    @Value("${binderua.rates.monthly-hours:160}")
    private int monthlyHours;

    @Value("${binderua.rates.pl-to-uah}")
    private BigDecimal plToUahRate;

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

    private BigDecimal calculateTotalCost(User user, List<TimeEntry> entries) {
        BigDecimal totalHours = entries.stream()
                .map(TimeEntry::getTotalHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (user.getContractType() == User.ContractType.UOP && user.getUopGrossRate() != null) {
            // UoP: totalHours * (uopGrossRate / monthlyHours)
            BigDecimal hourlyRate = user.getUopGrossRate()
                    .divide(BigDecimal.valueOf(monthlyHours), 2, RoundingMode.HALF_UP);
            return totalHours.multiply(hourlyRate);
        } else if (user.getContractType() == User.ContractType.B2B && user.getB2bHourlyNetRate() != null) {
            // B2B: totalHours * b2bHourlyNetRate
            return totalHours.multiply(user.getB2bHourlyNetRate());
        }

        return BigDecimal.ZERO;
    }

    private BigDecimal convertCurrency(BigDecimal amountPLN, String currency) {
        if ("UAH".equalsIgnoreCase(currency)) {
            return currencyService.convertPLNtoUAH(amountPLN);
        } else if ("USD".equalsIgnoreCase(currency)) {
            // Simplified USD conversion (would use actual rate in production)
            return amountPLN.divide(BigDecimal.valueOf(4.0), 2, RoundingMode.HALF_UP);
        }
        // Default to PLN
        return amountPLN;
    }

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

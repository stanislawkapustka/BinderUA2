package com.timetracker.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

/**
 * Service handling currency conversion and locale-specific formatting.
 * CRITICAL: Ukrainian locale requires special formatting with space as thousand separator
 * and comma as decimal separator (e.g., "1 234,56 ₴"), which differs from standard Java formatters.
 */
@Service
@RequiredArgsConstructor
public class CurrencyService {

    // Exchange rate PLN to UAH, configurable in application.yml (default: 10.5)
    @Value("${binderua.rates.pl-to-uah}")
    private BigDecimal plToUahRate;

    /**
     * Convert amount from PLN to UAH using configured exchange rate.
     *
     * @param plnAmount Amount in Polish Zloty
     * @return Amount in Ukrainian Hryvnia, rounded to 2 decimal places
     */
    public BigDecimal convertPLNtoUAH(BigDecimal plnAmount) {
        return plnAmount.multiply(plToUahRate).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Format currency amount according to language-specific locale rules.
     * 
     * Formatting rules by language:
     * - PL (Polish): "1 234,56 zł" - space thousand separator, comma decimal, suffix
     * - UA (Ukrainian): "1 234,56 ₴" - space thousand separator, comma decimal, suffix
     * - EN (English): "$1,234.56" - comma thousand separator, dot decimal, prefix
     *
     * @param amount Numeric amount to format
     * @param language Language code (PL, UA, EN) determining format rules
     * @return Formatted currency string with proper separators and symbol placement
     */
    public String formatCurrency(BigDecimal amount, String language) {
        DecimalFormatSymbols symbols;
        String currencySymbol;

        switch (language.toUpperCase()) {
            case "UA":
                // Ukrainian: 1 234,56 ₴ (space thousands, comma decimal)
                symbols = new DecimalFormatSymbols(new Locale("uk", "UA"));
                symbols.setGroupingSeparator(' ');
                symbols.setDecimalSeparator(',');
                currencySymbol = " ₴";
                break;
            case "EN":
                // English: $1,234.56
                symbols = new DecimalFormatSymbols(Locale.US);
                symbols.setGroupingSeparator(',');
                symbols.setDecimalSeparator('.');
                currencySymbol = "$";
                break;
            case "PL":
            default:
                // Polish: 1 234,56 zł (space thousands, comma decimal)
                symbols = new DecimalFormatSymbols(new Locale("pl", "PL"));
                symbols.setGroupingSeparator(' ');
                symbols.setDecimalSeparator(',');
                currencySymbol = " zł";
                break;
        }

        DecimalFormat formatter = new DecimalFormat("#,##0.00", symbols);
        
        if ("EN".equalsIgnoreCase(language)) {
            return currencySymbol + formatter.format(amount);
        } else {
            return formatter.format(amount) + currencySymbol;
        }
    }
}

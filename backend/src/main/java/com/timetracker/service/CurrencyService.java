package com.timetracker.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CurrencyService {

    @Value("${binderua.rates.pl-to-uah}")
    private BigDecimal plToUahRate;

    public BigDecimal convertPLNtoUAH(BigDecimal plnAmount) {
        return plnAmount.multiply(plToUahRate).setScale(2, RoundingMode.HALF_UP);
    }

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

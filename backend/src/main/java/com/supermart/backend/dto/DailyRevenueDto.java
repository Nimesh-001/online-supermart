package com.supermart.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class DailyRevenueDto {
    private LocalDate date;
    private BigDecimal revenue;

    public DailyRevenueDto() {}

    public DailyRevenueDto(LocalDate date, BigDecimal revenue) {
        this.date = date;
        this.revenue = revenue;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public BigDecimal getRevenue() { return revenue; }
    public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
}

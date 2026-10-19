package com.supermart.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class SalesSummaryDto {
    private LocalDate summaryDate;
    private Integer completedOrderCount;
    private BigDecimal grossSales;
    private BigDecimal discountsTotal;
    private BigDecimal netSales;

    public SalesSummaryDto() {}

    public LocalDate getSummaryDate() { return summaryDate; }
    public void setSummaryDate(LocalDate summaryDate) { this.summaryDate = summaryDate; }

    public Integer getCompletedOrderCount() { return completedOrderCount; }
    public void setCompletedOrderCount(Integer completedOrderCount) { this.completedOrderCount = completedOrderCount; }

    public BigDecimal getGrossSales() { return grossSales; }
    public void setGrossSales(BigDecimal grossSales) { this.grossSales = grossSales; }

    public BigDecimal getDiscountsTotal() { return discountsTotal; }
    public void setDiscountsTotal(BigDecimal discountsTotal) { this.discountsTotal = discountsTotal; }

    public BigDecimal getNetSales() { return netSales; }
    public void setNetSales(BigDecimal netSales) { this.netSales = netSales; }
}

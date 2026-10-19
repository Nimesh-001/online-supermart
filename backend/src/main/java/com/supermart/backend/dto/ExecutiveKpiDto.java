package com.supermart.backend.dto;

import java.math.BigDecimal;

public class ExecutiveKpiDto {
    private BigDecimal totalGrossRevenue;
    private BigDecimal totalNetRevenue;
    private Long totalOrders;
    private Long completedOrders;
    private Long pendingOrders;
    private Long totalCustomers;
    private BigDecimal todayRevenue;

    public ExecutiveKpiDto() {}

    public BigDecimal getTotalGrossRevenue() { return totalGrossRevenue; }
    public void setTotalGrossRevenue(BigDecimal totalGrossRevenue) { this.totalGrossRevenue = totalGrossRevenue; }

    public BigDecimal getTotalNetRevenue() { return totalNetRevenue; }
    public void setTotalNetRevenue(BigDecimal totalNetRevenue) { this.totalNetRevenue = totalNetRevenue; }

    public Long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Long totalOrders) { this.totalOrders = totalOrders; }

    public Long getCompletedOrders() { return completedOrders; }
    public void setCompletedOrders(Long completedOrders) { this.completedOrders = completedOrders; }

    public Long getPendingOrders() { return pendingOrders; }
    public void setPendingOrders(Long pendingOrders) { this.pendingOrders = pendingOrders; }

    public Long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(Long totalCustomers) { this.totalCustomers = totalCustomers; }

    public BigDecimal getTodayRevenue() { return todayRevenue; }
    public void setTodayRevenue(BigDecimal todayRevenue) { this.todayRevenue = todayRevenue; }
}

package com.supermart.backend.dto;

public class AdminStatsDto {

    private long totalUsers;
    private long totalProducts;
    private double totalStockQuantity;
    private long lowStockCount;
    private long unresolvedAlertsCount;
    private long totalStockMovements;

    public AdminStatsDto() {
    }

    public AdminStatsDto(long totalUsers, long totalProducts, double totalStockQuantity, long lowStockCount, long unresolvedAlertsCount, long totalStockMovements) {
        this.totalUsers = totalUsers;
        this.totalProducts = totalProducts;
        this.totalStockQuantity = totalStockQuantity;
        this.lowStockCount = lowStockCount;
        this.unresolvedAlertsCount = unresolvedAlertsCount;
        this.totalStockMovements = totalStockMovements;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalProducts() {
        return totalProducts;
    }

    public void setTotalProducts(long totalProducts) {
        this.totalProducts = totalProducts;
    }

    public double getTotalStockQuantity() {
        return totalStockQuantity;
    }

    public void setTotalStockQuantity(double totalStockQuantity) {
        this.totalStockQuantity = totalStockQuantity;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public long getUnresolvedAlertsCount() {
        return unresolvedAlertsCount;
    }

    public void setUnresolvedAlertsCount(long unresolvedAlertsCount) {
        this.unresolvedAlertsCount = unresolvedAlertsCount;
    }

    public long getTotalStockMovements() {
        return totalStockMovements;
    }

    public void setTotalStockMovements(long totalStockMovements) {
        this.totalStockMovements = totalStockMovements;
    }
}

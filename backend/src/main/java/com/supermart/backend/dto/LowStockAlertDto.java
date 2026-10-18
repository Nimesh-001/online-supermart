package com.supermart.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class LowStockAlertDto {

    private Long alertId;
    private Long productId;
    private String productName;
    private BigDecimal stockQuantity;
    private BigDecimal thresholdQuantity;
    private String alertStatus;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public LowStockAlertDto() {
    }

    public Long getAlertId() {
        return alertId;
    }

    public void setAlertId(Long alertId) {
        this.alertId = alertId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public BigDecimal getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(BigDecimal stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public BigDecimal getThresholdQuantity() {
        return thresholdQuantity;
    }

    public void setThresholdQuantity(BigDecimal thresholdQuantity) {
        this.thresholdQuantity = thresholdQuantity;
    }

    public String getAlertStatus() {
        return alertStatus;
    }

    public void setAlertStatus(String alertStatus) {
        this.alertStatus = alertStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}

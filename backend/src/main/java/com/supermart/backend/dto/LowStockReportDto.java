package com.supermart.backend.dto;

import java.math.BigDecimal;

public class LowStockReportDto {

    private Long productId;
    private String productName;
    private String categoryName;
    private BigDecimal stockQuantity;
    private BigDecimal lowStockThreshold;
    private BigDecimal deficit;

    public LowStockReportDto() {
    }

    public LowStockReportDto(Long productId, String productName, String categoryName, BigDecimal stockQuantity, BigDecimal lowStockThreshold) {
        this.productId = productId;
        this.productName = productName;
        this.categoryName = categoryName;
        this.stockQuantity = stockQuantity;
        this.lowStockThreshold = lowStockThreshold;
        if (lowStockThreshold != null && stockQuantity != null) {
            this.deficit = lowStockThreshold.subtract(stockQuantity).max(BigDecimal.ZERO);
        }
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

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public BigDecimal getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(BigDecimal stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public BigDecimal getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(BigDecimal lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }

    public BigDecimal getDeficit() {
        return deficit;
    }

    public void setDeficit(BigDecimal deficit) {
        this.deficit = deficit;
    }
}

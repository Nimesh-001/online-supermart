package com.supermart.backend.dto;

import java.math.BigDecimal;

public class GramPriceResponse {

    private Long productId;
    private String productName;
    private BigDecimal grams;
    private BigDecimal basePrice;
    private BigDecimal discountPercent;
    private BigDecimal finalPrice;

    public GramPriceResponse() {
    }

    public GramPriceResponse(Long productId, String productName, BigDecimal grams, BigDecimal basePrice, BigDecimal discountPercent, BigDecimal finalPrice) {
        this.productId = productId;
        this.productName = productName;
        this.grams = grams;
        this.basePrice = basePrice;
        this.discountPercent = discountPercent;
        this.finalPrice = finalPrice;
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

    public BigDecimal getGrams() {
        return grams;
    }

    public void setGrams(BigDecimal grams) {
        this.grams = grams;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public BigDecimal getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(BigDecimal discountPercent) {
        this.discountPercent = discountPercent;
    }

    public BigDecimal getFinalPrice() {
        return finalPrice;
    }

    public void setFinalPrice(BigDecimal finalPrice) {
        this.finalPrice = finalPrice;
    }
}

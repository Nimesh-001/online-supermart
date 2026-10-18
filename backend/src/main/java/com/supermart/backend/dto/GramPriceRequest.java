package com.supermart.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class GramPriceRequest {

    @NotNull(message = "Product ID is required.")
    private Long productId;

    @NotNull(message = "Weight in grams is required.")
    @Positive(message = "Weight must be greater than zero grams.")
    private BigDecimal grams;

    public GramPriceRequest() {
    }

    public GramPriceRequest(Long productId, BigDecimal grams) {
        this.productId = productId;
        this.grams = grams;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public BigDecimal getGrams() {
        return grams;
    }

    public void setGrams(BigDecimal grams) {
        this.grams = grams;
    }
}

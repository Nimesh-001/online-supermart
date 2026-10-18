package com.supermart.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class AtomicDecrementRequest {

    @NotNull(message = "Product ID is required.")
    private Long productId;

    @NotNull(message = "Deduct quantity is required.")
    @Positive(message = "Deduct quantity must be strictly positive.")
    private BigDecimal deductQuantity;

    public AtomicDecrementRequest() {
    }

    public AtomicDecrementRequest(Long productId, BigDecimal deductQuantity) {
        this.productId = productId;
        this.deductQuantity = deductQuantity;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public BigDecimal getDeductQuantity() {
        return deductQuantity;
    }

    public void setDeductQuantity(BigDecimal deductQuantity) {
        this.deductQuantity = deductQuantity;
    }
}

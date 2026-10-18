package com.supermart.backend.dto;

import java.math.BigDecimal;

public class AtomicDecrementResponse {

    private Long productId;
    private BigDecimal deductQuantity;
    private boolean success;
    private BigDecimal remainingStock;
    private String message;

    public AtomicDecrementResponse() {
    }

    public AtomicDecrementResponse(Long productId, BigDecimal deductQuantity, boolean success, BigDecimal remainingStock, String message) {
        this.productId = productId;
        this.deductQuantity = deductQuantity;
        this.success = success;
        this.remainingStock = remainingStock;
        this.message = message;
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

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public BigDecimal getRemainingStock() {
        return remainingStock;
    }

    public void setRemainingStock(BigDecimal remainingStock) {
        this.remainingStock = remainingStock;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

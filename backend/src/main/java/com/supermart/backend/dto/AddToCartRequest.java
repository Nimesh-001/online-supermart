package com.supermart.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class AddToCartRequest {

    @NotNull(message = "Product ID is required.")
    private Long productId;

    @NotNull(message = "Quantity is required.")
    @DecimalMin(value = "0.001", message = "Quantity must be greater than zero.")
    private BigDecimal quantity;

    private String productName;

    public AddToCartRequest() {
    }

    public AddToCartRequest(Long productId, BigDecimal quantity, String productName) {
        this.productId = productId;
        this.quantity = quantity;
        this.productName = productName;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }
}

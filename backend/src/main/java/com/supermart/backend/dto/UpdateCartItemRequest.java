package com.supermart.backend.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class UpdateCartItemRequest {

    @NotNull(message = "Quantity is required.")
    private BigDecimal quantity;

    public UpdateCartItemRequest() {
    }

    public UpdateCartItemRequest(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }
}

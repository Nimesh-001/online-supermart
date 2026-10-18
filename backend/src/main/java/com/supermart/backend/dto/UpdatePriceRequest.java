package com.supermart.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class UpdatePriceRequest {

    @NotNull(message = "New price is required.")
    @Positive(message = "Price must be strictly positive.")
    private BigDecimal newPrice;

    public UpdatePriceRequest() {
    }

    public UpdatePriceRequest(BigDecimal newPrice) {
        this.newPrice = newPrice;
    }

    public BigDecimal getNewPrice() {
        return newPrice;
    }

    public void setNewPrice(BigDecimal newPrice) {
        this.newPrice = newPrice;
    }
}

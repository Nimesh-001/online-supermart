package com.supermart.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class StockReplenishmentRequest {

    @NotNull(message = "Product ID is required.")
    private Long productId;

    @NotNull(message = "Quantity to add is required.")
    @Positive(message = "Quantity must be strictly positive.")
    private BigDecimal quantity;

    private Long actorId;

    private String notes;

    public StockReplenishmentRequest() {
    }

    public StockReplenishmentRequest(Long productId, BigDecimal quantity, Long actorId, String notes) {
        this.productId = productId;
        this.quantity = quantity;
        this.actorId = actorId;
        this.notes = notes;
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

    public Long getActorId() {
        return actorId;
    }

    public void setActorId(Long actorId) {
        this.actorId = actorId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

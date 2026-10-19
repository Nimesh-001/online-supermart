package com.supermart.backend.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CartSummaryDto {

    private Long cartId;
    private Long customerId;
    private String cartStatus;
    private List<CartDetailDto> items = new ArrayList<>();
    private int totalItemCount;
    private BigDecimal subtotal;

    public CartSummaryDto() {
    }

    public CartSummaryDto(Long cartId, Long customerId, String cartStatus, List<CartDetailDto> items, int totalItemCount, BigDecimal subtotal) {
        this.cartId = cartId;
        this.customerId = customerId;
        this.cartStatus = cartStatus;
        this.items = items;
        this.totalItemCount = totalItemCount;
        this.subtotal = subtotal;
    }

    public Long getCartId() {
        return cartId;
    }

    public void setCartId(Long cartId) {
        this.cartId = cartId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getCartStatus() {
        return cartStatus;
    }

    public void setCartStatus(String cartStatus) {
        this.cartStatus = cartStatus;
    }

    public List<CartDetailDto> getItems() {
        return items;
    }

    public void setItems(List<CartDetailDto> items) {
        this.items = items;
    }

    public int getTotalItemCount() {
        return totalItemCount;
    }

    public void setTotalItemCount(int totalItemCount) {
        this.totalItemCount = totalItemCount;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}

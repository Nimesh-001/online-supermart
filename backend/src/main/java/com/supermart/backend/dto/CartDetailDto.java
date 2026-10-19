package com.supermart.backend.dto;

import java.math.BigDecimal;

public class CartDetailDto {

    private Long cartId;
    private Long customerId;
    private Long cartItemId;
    private Long productId;
    private String productName;
    private String sellingUnit;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
    private String imageUrl;

    public CartDetailDto() {
    }

    public CartDetailDto(Long cartId, Long customerId, Long cartItemId, Long productId, String productName, String sellingUnit, BigDecimal quantity, BigDecimal unitPrice, BigDecimal lineTotal, String imageUrl) {
        this.cartId = cartId;
        this.customerId = customerId;
        this.cartItemId = cartItemId;
        this.productId = productId;
        this.productName = productName;
        this.sellingUnit = sellingUnit;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = lineTotal;
        this.imageUrl = imageUrl;
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

    public Long getCartItemId() {
        return cartItemId;
    }

    public void setCartItemId(Long cartItemId) {
        this.cartItemId = cartItemId;
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

    public String getSellingUnit() {
        return sellingUnit;
    }

    public void setSellingUnit(String sellingUnit) {
        this.sellingUnit = sellingUnit;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}

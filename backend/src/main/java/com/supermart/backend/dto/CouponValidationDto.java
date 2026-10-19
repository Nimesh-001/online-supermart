package com.supermart.backend.dto;

import java.math.BigDecimal;

public class CouponValidationDto {
    private String couponCode;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private boolean valid;
    private String message;

    public CouponValidationDto() {}

    public CouponValidationDto(String couponCode, BigDecimal subtotal, BigDecimal discountAmount, boolean valid, String message) {
        this.couponCode = couponCode;
        this.subtotal = subtotal;
        this.discountAmount = discountAmount;
        this.valid = valid;
        this.message = message;
    }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

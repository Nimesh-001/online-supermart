package com.supermart.backend.dto;

public class OrderStatusUpdateRequest {
    private String orderStatus;
    private String paymentStatus;

    public OrderStatusUpdateRequest() {}

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
}

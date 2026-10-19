package com.supermart.backend.dto;

import java.math.BigDecimal;

public class OrderItemDto {
    private Long orderItemId;
    private Long orderId;
    private Long productId;
    private String productName;
    private String sellingUnit;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;

    public OrderItemDto() {}

    public Long getOrderItemId() { return orderItemId; }
    public void setOrderItemId(Long orderItemId) { this.orderItemId = orderItemId; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getSellingUnit() { return sellingUnit; }
    public void setSellingUnit(String sellingUnit) { this.sellingUnit = sellingUnit; }

    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getLineTotal() { return lineTotal; }
    public void setLineTotal(BigDecimal lineTotal) { this.lineTotal = lineTotal; }
}

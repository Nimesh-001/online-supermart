package com.supermart.backend.dao;

import com.supermart.backend.dto.CustomerAddressDto;
import com.supermart.backend.dto.OrderInvoiceDto;
import com.supermart.backend.dto.OrderItemDto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface OrderDao {
    OrderInvoiceDto placeOrder(Long customerId, Long cartId, Long addressId, String couponCode, String paymentMethod);
    boolean testCheckoutConcurrencyLock(Long cartId);
    BigDecimal calculateCouponDiscount(String couponCode, BigDecimal subtotal);
    List<OrderInvoiceDto> findOrdersByCustomerId(Long customerId);
    List<OrderInvoiceDto> findAllOrders();
    Optional<OrderInvoiceDto> findOrderById(Long orderId);
    List<OrderItemDto> findOrderItems(Long orderId);
    boolean updateOrderStatus(Long orderId, String newOrderStatus, String newPaymentStatus);
    Long findOrCreateCustomerAddress(Long customerId, String addressLine, String city, String postalCode);
    List<CustomerAddressDto> getCustomerAddresses(Long customerId);
    int cancelExpiredOrders();
}

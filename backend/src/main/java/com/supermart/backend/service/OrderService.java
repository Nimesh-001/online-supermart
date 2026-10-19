package com.supermart.backend.service;

import com.supermart.backend.dto.CheckoutRequest;
import com.supermart.backend.dto.CouponValidationDto;
import com.supermart.backend.dto.CustomerAddressDto;
import com.supermart.backend.dto.OrderInvoiceDto;

import java.util.List;

public interface OrderService {
    OrderInvoiceDto checkout(Long customerId, CheckoutRequest request);
    CouponValidationDto validateCoupon(String couponCode, Long customerId);
    boolean testCheckoutConcurrencyLock(Long customerId);
    List<OrderInvoiceDto> getCustomerOrders(Long customerId);
    OrderInvoiceDto getOrderInvoice(Long orderId);
    List<OrderInvoiceDto> getAllOrders();
    boolean updateOrderStatus(Long orderId, String newStatus, String newPaymentStatus);
    List<CustomerAddressDto> getCustomerAddresses(Long customerId);
    CustomerAddressDto addCustomerAddress(Long customerId, CustomerAddressDto address);
    int cancelExpiredOrders();
}

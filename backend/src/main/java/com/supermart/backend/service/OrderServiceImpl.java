package com.supermart.backend.service;

import com.supermart.backend.dao.CartDao;
import com.supermart.backend.dao.OrderDao;
import com.supermart.backend.dto.CartDetailDto;
import com.supermart.backend.dto.CheckoutRequest;
import com.supermart.backend.dto.CouponValidationDto;
import com.supermart.backend.dto.CustomerAddressDto;
import com.supermart.backend.dto.OrderInvoiceDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderDao orderDao;
    private final CartDao cartDao;

    public OrderServiceImpl(OrderDao orderDao, CartDao cartDao) {
        this.orderDao = orderDao;
        this.cartDao = cartDao;
    }

    @Override
    @Transactional
    public OrderInvoiceDto checkout(Long customerId, CheckoutRequest request) {
        Long cartId = cartDao.getOrCreateActiveCart(customerId);
        List<CartDetailDto> items = cartDao.findCartDetails(cartId);
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Cannot checkout: Active shopping cart has no items.");
        }

        // 1. Resolve Delivery Address
        Long addressId = request.getAddressId();
        if (addressId == null) {
            String line = request.getAddressLine() != null ? request.getAddressLine().trim() : "123 Main Street";
            String city = request.getCity() != null ? request.getCity().trim() : "Colombo";
            String postal = request.getPostalCode() != null ? request.getPostalCode().trim() : "00100";
            addressId = orderDao.findOrCreateCustomerAddress(customerId, line, city, postal);
        }

        // 2. Perform Concurrency Two-Phase Lock Check via sp_test_checkout_concurrency_lock
        boolean canCheckout = orderDao.testCheckoutConcurrencyLock(cartId);
        if (!canCheckout) {
            throw new IllegalStateException("Checkout Aborted: One or more cart items exceed available warehouse inventory stock.");
        }

        // 3. Execute ACID Multi-Step Stored Procedure sp_place_order
        String paymentMethod = "COD".equalsIgnoreCase(request.getPaymentMethod()) ? "COD" : "CARD_TEST";
        return orderDao.placeOrder(customerId, cartId, addressId, request.getCouponCode(), paymentMethod);
    }

    @Override
    public CouponValidationDto validateCoupon(String couponCode, Long customerId) {
        if (couponCode == null || couponCode.trim().isEmpty()) {
            return new CouponValidationDto("", BigDecimal.ZERO, BigDecimal.ZERO, false, "Please enter a coupon code.");
        }
        Long cartId = cartDao.getOrCreateActiveCart(customerId);
        BigDecimal subtotal = cartDao.getCartSubtotal(cartId);
        BigDecimal discount = orderDao.calculateCouponDiscount(couponCode.trim(), subtotal);

        boolean isValid = discount.compareTo(BigDecimal.ZERO) > 0;
        String message = isValid
                ? "Coupon '" + couponCode.toUpperCase() + "' applied! Discount: LKR " + discount
                : "Coupon '" + couponCode.toUpperCase() + "' is invalid or minimum cart subtotal of LKR 5000.00 is not met.";

        return new CouponValidationDto(couponCode.trim().toUpperCase(), subtotal, discount, isValid, message);
    }

    @Override
    public boolean testCheckoutConcurrencyLock(Long customerId) {
        Long cartId = cartDao.getOrCreateActiveCart(customerId);
        return orderDao.testCheckoutConcurrencyLock(cartId);
    }

    @Override
    public List<OrderInvoiceDto> getCustomerOrders(Long customerId) {
        return orderDao.findOrdersByCustomerId(customerId);
    }

    @Override
    public OrderInvoiceDto getOrderInvoice(Long orderId) {
        return orderDao.findOrderById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order with ID #" + orderId + " was not found."));
    }

    @Override
    public List<OrderInvoiceDto> getAllOrders() {
        return orderDao.findAllOrders();
    }

    @Override
    public boolean updateOrderStatus(Long orderId, String newStatus, String newPaymentStatus) {
        return orderDao.updateOrderStatus(orderId, newStatus, newPaymentStatus);
    }

    @Override
    public List<CustomerAddressDto> getCustomerAddresses(Long customerId) {
        return orderDao.getCustomerAddresses(customerId);
    }

    @Override
    public CustomerAddressDto addCustomerAddress(Long customerId, CustomerAddressDto address) {
        Long addrId = orderDao.findOrCreateCustomerAddress(
                customerId,
                address.getAddressLine(),
                address.getCity(),
                address.getPostalCode()
        );
        address.setAddressId(addrId);
        address.setCustomerId(customerId);
        return address;
    }

    @Override
    public int cancelExpiredOrders() {
        return orderDao.cancelExpiredOrders();
    }
}

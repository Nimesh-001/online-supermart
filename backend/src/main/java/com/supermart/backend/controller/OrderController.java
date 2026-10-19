package com.supermart.backend.controller;

import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.dto.CheckoutRequest;
import com.supermart.backend.dto.CouponValidationDto;
import com.supermart.backend.dto.CustomerAddressDto;
import com.supermart.backend.dto.OrderInvoiceDto;
import com.supermart.backend.dto.OrderStatusUpdateRequest;
import com.supermart.backend.exception.UnauthorizedException;
import com.supermart.backend.service.CustomerAuthServiceImpl;
import com.supermart.backend.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    private Long getAuthenticatedCustomerId(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session == null || session.getAttribute(CustomerAuthServiceImpl.SESSION_USER_ID) == null) {
            throw new UnauthorizedException("Authentication required. Please sign in to proceed.");
        }
        return (Long) session.getAttribute(CustomerAuthServiceImpl.SESSION_USER_ID);
    }

    private String getAuthenticatedUserRole(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null && session.getAttribute(CustomerAuthServiceImpl.SESSION_USER_ROLE) != null) {
            return (String) session.getAttribute(CustomerAuthServiceImpl.SESSION_USER_ROLE);
        }
        return null;
    }

    /**
     * Member 5 Main Endpoint: Checkout with ACID Multi-Step Stored Procedure sp_place_order
     */
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<OrderInvoiceDto>> checkout(
            @RequestBody(required = false) CheckoutRequest request,
            HttpServletRequest httpRequest) {

        Long customerId = getAuthenticatedCustomerId(httpRequest);
        CheckoutRequest req = request != null ? request : new CheckoutRequest();
        OrderInvoiceDto invoice = orderService.checkout(customerId, req);
        return ResponseEntity.ok(ApiResponse.success("Order placed successfully with ACID multi-step transaction.", invoice));
    }

    /**
     * Member 5 Concurrency Procedure: sp_test_checkout_concurrency_lock
     */
    @PostMapping("/test-lock")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testCheckoutConcurrencyLock(HttpServletRequest httpRequest) {
        Long customerId = getAuthenticatedCustomerId(httpRequest);
        boolean canCheckout = orderService.testCheckoutConcurrencyLock(customerId);
        return ResponseEntity.ok(ApiResponse.success("Concurrency two-phase lock evaluation completed.", Map.of(
                "canCheckout", canCheckout,
                "lockType", "TWO_PHASE_PESSIMISTIC_FOR_UPDATE",
                "status", canCheckout ? "STOCK_AVAILABLE_FOR_CHECKOUT" : "INSUFFICIENT_STOCK_LOCK_ABORTED"
        )));
    }

    /**
     * Member 5 Stored Function: fn_calculate_coupon_discount
     */
    @PostMapping("/validate-coupon")
    public ResponseEntity<ApiResponse<CouponValidationDto>> validateCoupon(
            @RequestBody Map<String, String> body,
            HttpServletRequest httpRequest) {

        Long customerId = getAuthenticatedCustomerId(httpRequest);
        String couponCode = body.get("couponCode");
        CouponValidationDto result = orderService.validateCoupon(couponCode, customerId);
        return ResponseEntity.ok(ApiResponse.success("Coupon evaluated via fn_calculate_coupon_discount.", result));
    }

    /**
     * Member 5 View: v_order_invoices for current customer
     */
    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<List<OrderInvoiceDto>>> getMyOrders(HttpServletRequest httpRequest) {
        Long customerId = getAuthenticatedCustomerId(httpRequest);
        List<OrderInvoiceDto> orders = orderService.getCustomerOrders(customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer order history retrieved.", orders));
    }

    /**
     * Single Order Invoice from v_order_invoices
     */
    @GetMapping("/{id}/invoice")
    public ResponseEntity<ApiResponse<OrderInvoiceDto>> getOrderInvoice(
            @PathVariable("id") Long orderId,
            HttpServletRequest httpRequest) {

        // Validate customer session
        getAuthenticatedCustomerId(httpRequest);
        OrderInvoiceDto invoice = orderService.getOrderInvoice(orderId);
        return ResponseEntity.ok(ApiResponse.success("Order invoice retrieved from v_order_invoices.", invoice));
    }

    /**
     * Customer Delivery Addresses
     */
    @GetMapping("/addresses")
    public ResponseEntity<ApiResponse<List<CustomerAddressDto>>> getAddresses(HttpServletRequest httpRequest) {
        Long customerId = getAuthenticatedCustomerId(httpRequest);
        List<CustomerAddressDto> addresses = orderService.getCustomerAddresses(customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer delivery addresses retrieved.", addresses));
    }

    @PostMapping("/addresses")
    public ResponseEntity<ApiResponse<CustomerAddressDto>> addAddress(
            @RequestBody CustomerAddressDto addressDto,
            HttpServletRequest httpRequest) {

        Long customerId = getAuthenticatedCustomerId(httpRequest);
        CustomerAddressDto created = orderService.addCustomerAddress(customerId, addressDto);
        return ResponseEntity.ok(ApiResponse.success("Customer address saved.", created));
    }

    /**
     * Staff & Operational Manager Endpoint: View all orders across the system
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<OrderInvoiceDto>>> getAllOrders(HttpServletRequest httpRequest) {
        String role = getAuthenticatedUserRole(httpRequest);
        if (role == null || (!role.equals("SUPER_ADMIN") && !role.equals("OPERATIONAL_MANAGER"))) {
            throw new UnauthorizedException("Access Denied: Staff or Manager role required.");
        }
        List<OrderInvoiceDto> allOrders = orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success("All store orders retrieved.", allOrders));
    }

    /**
     * Operational Manager Endpoint: Update order fulfillment status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateOrderStatus(
            @PathVariable("id") Long orderId,
            @RequestBody OrderStatusUpdateRequest request,
            HttpServletRequest httpRequest) {

        String role = getAuthenticatedUserRole(httpRequest);
        if (role == null || (!role.equals("SUPER_ADMIN") && !role.equals("OPERATIONAL_MANAGER"))) {
            throw new UnauthorizedException("Access Denied: Operational Manager or Admin role required.");
        }

        boolean updated = orderService.updateOrderStatus(orderId, request.getOrderStatus(), request.getPaymentStatus());
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully.", Map.of(
                "orderId", orderId,
                "newOrderStatus", request.getOrderStatus(),
                "newPaymentStatus", request.getPaymentStatus() != null ? request.getPaymentStatus() : "UNCHANGED",
                "updated", updated
        )));
    }

    /**
     * Member 5 Event Simulation: evt_cancel_expired_orders
     */
    @PostMapping("/cancel-expired")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cancelExpiredOrders(HttpServletRequest httpRequest) {
        int cancelledCount = orderService.cancelExpiredOrders();
        return ResponseEntity.ok(ApiResponse.success("Expired orders cleanup job simulated (evt_cancel_expired_orders).", Map.of(
                "cancelledOrdersCount", cancelledCount
        )));
    }
}

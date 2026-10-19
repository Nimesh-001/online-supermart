package com.supermart.backend.controller;

import com.supermart.backend.dto.AddToCartRequest;
import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.dto.CartItemRequest;
import com.supermart.backend.dto.CartSummaryDto;
import com.supermart.backend.dto.ReserveCartItemRequest;
import com.supermart.backend.dto.ReserveCartResponse;
import com.supermart.backend.dto.UpdateCartItemRequest;
import com.supermart.backend.exception.UnauthorizedException;
import com.supermart.backend.service.CartService;
import com.supermart.backend.service.CustomerAuthServiceImpl;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CustomerCartController {

    private final CartService cartService;

    public CustomerCartController(CartService cartService) {
        this.cartService = cartService;
    }

    private Long getAuthenticatedCustomerId(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session == null || session.getAttribute(CustomerAuthServiceImpl.SESSION_USER_ID) == null) {
            throw new UnauthorizedException("Authentication required. Please sign in to access your shopping cart.");
        }
        return (Long) session.getAttribute(CustomerAuthServiceImpl.SESSION_USER_ID);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CartSummaryDto>> getCart(HttpServletRequest httpRequest) {
        Long customerId = getAuthenticatedCustomerId(httpRequest);
        CartSummaryDto summary = cartService.getCartForCustomer(customerId);
        return ResponseEntity.ok(ApiResponse.success("Cart details retrieved successfully.", summary));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addItemToCartLegacy(
            @Valid @RequestBody CartItemRequest request,
            HttpServletRequest httpRequest) {

        Long customerId = getAuthenticatedCustomerId(httpRequest);
        BigDecimal qty = BigDecimal.valueOf(request.getQuantity());
        CartSummaryDto summary = cartService.addItem(customerId, request.getProductId(), qty);

        return ResponseEntity.ok(ApiResponse.success(
                "Added " + (request.getProductName() != null ? request.getProductName() : "item") + " to your cart.",
                Map.of(
                        "productId", request.getProductId(),
                        "quantity", request.getQuantity(),
                        "customerId", customerId,
                        "cartId", summary.getCartId(),
                        "subtotal", summary.getSubtotal()
                )
        ));
    }

    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartSummaryDto>> addItemToCart(
            @Valid @RequestBody AddToCartRequest request,
            HttpServletRequest httpRequest) {

        Long customerId = getAuthenticatedCustomerId(httpRequest);
        CartSummaryDto summary = cartService.addItem(customerId, request.getProductId(), request.getQuantity());

        return ResponseEntity.ok(ApiResponse.success("Item added to cart via sp_add_to_cart.", summary));
    }

    @PostMapping("/reserve")
    public ResponseEntity<ApiResponse<ReserveCartResponse>> reserveCartItemWithSavepoint(
            @Valid @RequestBody ReserveCartItemRequest request,
            HttpServletRequest httpRequest) {

        Long customerId = getAuthenticatedCustomerId(httpRequest);
        ReserveCartResponse response = cartService.reserveItemWithSavepoint(customerId, request.getProductId(), request.getQuantity());

        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartSummaryDto>> updateCartItemQuantity(
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            HttpServletRequest httpRequest) {

        Long customerId = getAuthenticatedCustomerId(httpRequest);
        CartSummaryDto summary = cartService.updateItemQuantity(customerId, cartItemId, request.getQuantity());

        return ResponseEntity.ok(ApiResponse.success("Cart item quantity updated.", summary));
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartSummaryDto>> removeCartItem(
            @PathVariable Long cartItemId,
            HttpServletRequest httpRequest) {

        Long customerId = getAuthenticatedCustomerId(httpRequest);
        CartSummaryDto summary = cartService.removeItem(customerId, cartItemId);

        return ResponseEntity.ok(ApiResponse.success("Item removed from cart.", summary));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<ApiResponse<CartSummaryDto>> clearCart(HttpServletRequest httpRequest) {
        Long customerId = getAuthenticatedCustomerId(httpRequest);
        CartSummaryDto summary = cartService.clearCart(customerId);

        return ResponseEntity.ok(ApiResponse.success("Shopping cart cleared.", summary));
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkCheckoutAccess(HttpServletRequest httpRequest) {
        Long customerId = getAuthenticatedCustomerId(httpRequest);
        CartSummaryDto summary = cartService.getCartForCustomer(customerId);

        return ResponseEntity.ok(ApiResponse.success(
                "Customer verified for checkout.",
                Map.of(
                        "customerId", customerId,
                        "cartId", summary.getCartId(),
                        "itemCount", summary.getTotalItemCount(),
                        "subtotal", summary.getSubtotal()
                )
        ));
    }

    @PostMapping("/cleanup-abandoned")
    public ResponseEntity<ApiResponse<Map<String, Object>>> cleanupAbandonedCarts(
            @RequestParam(defaultValue = "7") int days) {

        int abandonedCount = cartService.cleanupAbandonedCarts(days);
        return ResponseEntity.ok(ApiResponse.success(
                "Abandoned cart cleanup executed.",
                Map.of("markedAbandonedCount", abandonedCount, "thresholdDays", days)
        ));
    }
}

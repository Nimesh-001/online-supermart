package com.supermart.backend.dao;

import com.supermart.backend.dto.CartDetailDto;

import java.math.BigDecimal;
import java.util.List;

public interface CartDao {

    Long getOrCreateActiveCart(Long customerId);

    List<CartDetailDto> findCartDetails(Long cartId);

    BigDecimal getCartSubtotal(Long cartId);

    void addToCart(Long cartId, Long productId, BigDecimal quantity);

    String reserveCartWithSavepoint(Long cartId, Long productId, BigDecimal quantity);

    void updateCartItemQuantity(Long cartId, Long cartItemId, BigDecimal quantity);

    void removeCartItem(Long cartId, Long cartItemId);

    void clearCart(Long cartId);

    int cleanupAbandonedCarts(int daysThreshold);
}

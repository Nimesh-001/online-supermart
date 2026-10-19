package com.supermart.backend.service;

import com.supermart.backend.dto.CartSummaryDto;
import com.supermart.backend.dto.ReserveCartResponse;

import java.math.BigDecimal;

public interface CartService {

    CartSummaryDto getCartForCustomer(Long customerId);

    CartSummaryDto addItem(Long customerId, Long productId, BigDecimal quantity);

    ReserveCartResponse reserveItemWithSavepoint(Long customerId, Long productId, BigDecimal quantity);

    CartSummaryDto updateItemQuantity(Long customerId, Long cartItemId, BigDecimal quantity);

    CartSummaryDto removeItem(Long customerId, Long cartItemId);

    CartSummaryDto clearCart(Long customerId);

    int cleanupAbandonedCarts(int daysThreshold);
}

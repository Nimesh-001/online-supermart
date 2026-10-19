package com.supermart.backend.service;

import com.supermart.backend.dao.CartDao;
import com.supermart.backend.dto.CartDetailDto;
import com.supermart.backend.dto.CartSummaryDto;
import com.supermart.backend.dto.ReserveCartResponse;
import com.supermart.backend.exception.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CartServiceImpl implements CartService {

    private final CartDao cartDao;

    public CartServiceImpl(CartDao cartDao) {
        this.cartDao = cartDao;
    }

    @Override
    @Transactional(readOnly = true)
    public CartSummaryDto getCartForCustomer(Long customerId) {
        Long cartId = cartDao.getOrCreateActiveCart(customerId);
        List<CartDetailDto> items = cartDao.findCartDetails(cartId);
        BigDecimal subtotal = cartDao.getCartSubtotal(cartId);

        return new CartSummaryDto(
                cartId,
                customerId,
                "ACTIVE",
                items,
                items.size(),
                subtotal
        );
    }

    @Override
    @Transactional
    public CartSummaryDto addItem(Long customerId, Long productId, BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Quantity must be greater than zero.");
        }

        Long cartId = cartDao.getOrCreateActiveCart(customerId);
        cartDao.addToCart(cartId, productId, quantity);

        return getCartForCustomer(customerId);
    }

    @Override
    @Transactional
    public ReserveCartResponse reserveItemWithSavepoint(Long customerId, Long productId, BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Quantity must be greater than zero.");
        }

        Long cartId = cartDao.getOrCreateActiveCart(customerId);
        String status = cartDao.reserveCartWithSavepoint(cartId, productId, quantity);

        boolean isSuccess = "SUCCESS_RESERVED".equalsIgnoreCase(status);
        String msg;
        if (isSuccess) {
            msg = "Inventory reserved and added to cart under exclusive row lock with transaction savepoint.";
        } else if ("INSUFFICIENT_STOCK_ROLLED_BACK".equalsIgnoreCase(status)) {
            msg = "Insufficient stock available; transaction rolled back safely to savepoint.";
        } else {
            msg = "Reservation failed: " + status;
        }

        return new ReserveCartResponse(status, isSuccess, msg);
    }

    @Override
    @Transactional
    public CartSummaryDto updateItemQuantity(Long customerId, Long cartItemId, BigDecimal quantity) {
        Long cartId = cartDao.getOrCreateActiveCart(customerId);

        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            // Passing <= 0 to cartDao will intentionally fire database trigger trg_validate_cart_qty
            cartDao.updateCartItemQuantity(cartId, cartItemId, quantity != null ? quantity : BigDecimal.ZERO);
        } else {
            cartDao.updateCartItemQuantity(cartId, cartItemId, quantity);
        }

        return getCartForCustomer(customerId);
    }

    @Override
    @Transactional
    public CartSummaryDto removeItem(Long customerId, Long cartItemId) {
        Long cartId = cartDao.getOrCreateActiveCart(customerId);
        cartDao.removeCartItem(cartId, cartItemId);
        return getCartForCustomer(customerId);
    }

    @Override
    @Transactional
    public CartSummaryDto clearCart(Long customerId) {
        Long cartId = cartDao.getOrCreateActiveCart(customerId);
        cartDao.clearCart(cartId);
        return getCartForCustomer(customerId);
    }

    @Override
    @Transactional
    public int cleanupAbandonedCarts(int daysThreshold) {
        return cartDao.cleanupAbandonedCarts(daysThreshold);
    }
}

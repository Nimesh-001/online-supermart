package com.supermart.backend.controller;

import com.supermart.backend.dao.UserDao;
import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.dto.CartItemRequest;
import com.supermart.backend.exception.UnauthorizedException;
import com.supermart.backend.service.CustomerAuthServiceImpl;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CustomerCartController {

    private final UserDao userDao;

    public CustomerCartController(UserDao userDao) {
        this.userDao = userDao;
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addItemToCart(
            @Valid @RequestBody CartItemRequest request,
            HttpServletRequest httpRequest) {

        HttpSession session = httpRequest.getSession(false);
        if (session == null || session.getAttribute(CustomerAuthServiceImpl.SESSION_USER_ID) == null) {
            throw new UnauthorizedException("Authentication required. Please sign in to add items to your cart.");
        }

        Long customerUserId = (Long) session.getAttribute(CustomerAuthServiceImpl.SESSION_USER_ID);
        userDao.addCartItem(customerUserId, request.getProductId(), request.getQuantity());

        return ResponseEntity.ok(ApiResponse.success(
                "Added " + (request.getProductName() != null ? request.getProductName() : "item") + " to your cart.",
                Map.of(
                        "productId", request.getProductId(),
                        "quantity", request.getQuantity(),
                        "customerId", customerUserId
                )
        ));
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkCheckoutAccess(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session == null || session.getAttribute(CustomerAuthServiceImpl.SESSION_USER_ID) == null) {
            throw new UnauthorizedException("Authentication required. Please sign in to proceed to checkout.");
        }

        Long customerUserId = (Long) session.getAttribute(CustomerAuthServiceImpl.SESSION_USER_ID);

        return ResponseEntity.ok(ApiResponse.success(
                "Customer verified for checkout.",
                Map.of("customerId", customerUserId)
        ));
    }
}

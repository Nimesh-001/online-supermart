package com.supermart.backend.controller;

import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.dto.CustomerRegistrationRequest;
import com.supermart.backend.dto.CustomerRegistrationResponse;
import com.supermart.backend.dto.LoginRequest;
import com.supermart.backend.dto.LoginResponse;
import com.supermart.backend.service.CustomerAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class CustomerAuthController {

    private final CustomerAuthService customerAuthService;

    public CustomerAuthController(CustomerAuthService customerAuthService) {
        this.customerAuthService = customerAuthService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<CustomerRegistrationResponse>> register(
            @Valid @RequestBody CustomerRegistrationRequest request) {

        CustomerRegistrationResponse responseData = customerAuthService.registerCustomer(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Customer registration successful! Welcome to SuperMart Online.", responseData));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        LoginResponse responseData = customerAuthService.login(request, httpRequest);

        return ResponseEntity
                .ok(ApiResponse.success("Login successful. Welcome back!", responseData));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse>> getCurrentUser(HttpServletRequest httpRequest) {
        LoginResponse responseData = customerAuthService.getAuthenticatedUser(httpRequest);

        return ResponseEntity.ok(ApiResponse.success("Active session authenticated.", responseData));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest httpRequest) {
        customerAuthService.logout(httpRequest);

        return ResponseEntity.ok(ApiResponse.success("Logged out successfully.", null));
    }
}

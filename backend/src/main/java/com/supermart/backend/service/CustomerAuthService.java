package com.supermart.backend.service;

import com.supermart.backend.dto.CustomerRegistrationRequest;
import com.supermart.backend.dto.CustomerRegistrationResponse;
import com.supermart.backend.dto.LoginRequest;
import com.supermart.backend.dto.LoginResponse;
import jakarta.servlet.http.HttpServletRequest;

public interface CustomerAuthService {

    CustomerRegistrationResponse registerCustomer(CustomerRegistrationRequest request);

    LoginResponse login(LoginRequest request, HttpServletRequest httpRequest);

    LoginResponse getAuthenticatedUser(HttpServletRequest httpRequest);

    void logout(HttpServletRequest httpRequest);
}

package com.supermart.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> getRootStatus() {
        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("customerRegistration", "POST /api/auth/register");
        endpoints.put("customerLogin", "POST /api/auth/login");
        endpoints.put("currentUser", "GET /api/auth/me");
        endpoints.put("customerLogout", "POST /api/auth/logout");
        endpoints.put("productCatalog", "GET /api/products");
        endpoints.put("categories", "GET /api/categories");
        endpoints.put("brands", "GET /api/brands");
        endpoints.put("produceGramPricing", "POST /api/products/calculate-price");
        endpoints.put("inventoryStatus", "GET /api/inventory");
        endpoints.put("lowStockReport", "GET /api/inventory/low-stock");
        endpoints.put("stockReplenishment", "POST /api/inventory/replenish");
        endpoints.put("atomicStockDecrement", "POST /api/inventory/atomic-decrement");
        endpoints.put("stockMovements", "GET /api/inventory/movements");
        endpoints.put("lowStockAlerts", "GET /api/inventory/alerts");
        endpoints.put("addToCart", "POST /api/cart/add");
        endpoints.put("cartCheckout", "POST /api/cart/checkout");
        endpoints.put("adminUsers", "GET,POST /api/admin/users");
        endpoints.put("adminUserStatus", "PUT /api/admin/users/{id}/status");
        endpoints.put("adminUserRole", "PUT /api/admin/users/{id}/role");
        endpoints.put("adminStats", "GET /api/admin/stats");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("service", "SuperMart Online Backend API");
        response.put("version", "1.0.0");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("endpoints", endpoints);
        response.put("message", "SuperMart Online API is running smoothly.");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/api")
    public ResponseEntity<Map<String, Object>> getApiStatus() {
        return getRootStatus();
    }
}

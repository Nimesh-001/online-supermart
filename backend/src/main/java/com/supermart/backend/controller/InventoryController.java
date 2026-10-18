package com.supermart.backend.controller;

import com.supermart.backend.dto.*;
import com.supermart.backend.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryDto>>> getAllInventory() {
        List<InventoryDto> inventory = inventoryService.getAllInventory();
        return ResponseEntity.ok(ApiResponse.success("Current inventory records retrieved successfully.", inventory));
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<InventoryDto>> getInventoryByProductId(@PathVariable Long productId) {
        InventoryDto inventory = inventoryService.getInventoryByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success("Product inventory retrieved successfully.", inventory));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<LowStockReportDto>>> getLowStockReport() {
        // Direct query to MySQL View v_low_stock_report
        List<LowStockReportDto> report = inventoryService.getLowStockReport();
        return ResponseEntity.ok(ApiResponse.success("Low stock report retrieved from v_low_stock_report view.", report));
    }

    @GetMapping("/movements")
    public ResponseEntity<ApiResponse<List<StockMovementDto>>> getRecentMovements(
            @RequestParam(defaultValue = "30") int limit) {
        List<StockMovementDto> movements = inventoryService.getRecentMovements(limit);
        return ResponseEntity.ok(ApiResponse.success("Stock movements ledger retrieved successfully.", movements));
    }

    @GetMapping("/alerts")
    public ResponseEntity<ApiResponse<List<LowStockAlertDto>>> getAlerts(
            @RequestParam(required = false) String status) {
        List<LowStockAlertDto> alerts = inventoryService.getAlerts(status);
        return ResponseEntity.ok(ApiResponse.success("Low stock alerts retrieved.", alerts));
    }

    @PutMapping("/alerts/{alertId}/resolve")
    public ResponseEntity<ApiResponse<String>> resolveAlert(@PathVariable Long alertId) {
        inventoryService.resolveAlert(alertId);
        return ResponseEntity.ok(ApiResponse.success("Alert #" + alertId + " marked as RESOLVED.", "RESOLVED"));
    }

    @PostMapping("/replenish")
    public ResponseEntity<ApiResponse<InventoryDto>> replenishStock(
            @Valid @RequestBody StockReplenishmentRequest request) {
        // Calls Member 3 stored procedure sp_add_stock
        InventoryDto updated = inventoryService.replenishStock(request);
        return ResponseEntity.ok(ApiResponse.success("Stock replenishment transaction completed via sp_add_stock.", updated));
    }

    @PostMapping("/atomic-decrement")
    public ResponseEntity<ApiResponse<AtomicDecrementResponse>> atomicDecrement(
            @Valid @RequestBody AtomicDecrementRequest request) {
        // Calls Member 3 concurrency procedure sp_atomic_stock_decrement
        AtomicDecrementResponse response = inventoryService.atomicDecrement(request);
        return ResponseEntity.ok(ApiResponse.success("Atomic stock decrement evaluated via sp_atomic_stock_decrement.", response));
    }

    @PutMapping("/{productId}/threshold")
    public ResponseEntity<ApiResponse<InventoryDto>> updateThreshold(
            @PathVariable Long productId,
            @RequestBody Map<String, BigDecimal> body) {
        BigDecimal newThreshold = body.get("threshold");
        InventoryDto updated = inventoryService.updateThreshold(productId, newThreshold);
        return ResponseEntity.ok(ApiResponse.success("Threshold updated successfully.", updated));
    }
}

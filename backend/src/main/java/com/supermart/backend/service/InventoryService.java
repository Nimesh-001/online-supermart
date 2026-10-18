package com.supermart.backend.service;

import com.supermart.backend.dto.*;

import java.math.BigDecimal;
import java.util.List;

public interface InventoryService {

    List<InventoryDto> getAllInventory();

    InventoryDto getInventoryByProductId(Long productId);

    List<LowStockReportDto> getLowStockReport();

    List<StockMovementDto> getRecentMovements(int limit);

    List<LowStockAlertDto> getAlerts(String status);

    boolean resolveAlert(Long alertId);

    InventoryDto replenishStock(StockReplenishmentRequest request);

    AtomicDecrementResponse atomicDecrement(AtomicDecrementRequest request);

    InventoryDto updateThreshold(Long productId, BigDecimal newThreshold);
}

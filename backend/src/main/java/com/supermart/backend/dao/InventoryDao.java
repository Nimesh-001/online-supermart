package com.supermart.backend.dao;

import com.supermart.backend.dto.InventoryDto;
import com.supermart.backend.dto.LowStockAlertDto;
import com.supermart.backend.dto.LowStockReportDto;
import com.supermart.backend.dto.StockMovementDto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface InventoryDao {

    List<InventoryDto> findAllInventory();

    Optional<InventoryDto> findInventoryByProductId(Long productId);

    List<LowStockReportDto> findLowStockReport();

    List<StockMovementDto> findRecentMovements(int limit);

    List<LowStockAlertDto> findAlerts(String status);

    boolean resolveAlert(Long alertId);

    void addStock(Long productId, BigDecimal quantity, Long actorId);

    boolean atomicStockDecrement(Long productId, BigDecimal deductQuantity);

    void updateThreshold(Long productId, BigDecimal newThreshold);

    String getStockStatus(Long productId);
}

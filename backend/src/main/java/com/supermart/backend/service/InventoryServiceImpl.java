package com.supermart.backend.service;

import com.supermart.backend.dao.InventoryDao;
import com.supermart.backend.dto.*;
import com.supermart.backend.exception.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class InventoryServiceImpl implements InventoryService {

    private final InventoryDao inventoryDao;

    public InventoryServiceImpl(InventoryDao inventoryDao) {
        this.inventoryDao = inventoryDao;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryDto> getAllInventory() {
        return inventoryDao.findAllInventory();
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryDto getInventoryByProductId(Long productId) {
        return inventoryDao.findInventoryByProductId(productId)
            .orElseThrow(() -> new BadRequestException("Inventory record not found for product ID: " + productId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<LowStockReportDto> getLowStockReport() {
        return inventoryDao.findLowStockReport();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockMovementDto> getRecentMovements(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return inventoryDao.findRecentMovements(safeLimit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LowStockAlertDto> getAlerts(String status) {
        return inventoryDao.findAlerts(status);
    }

    @Override
    @Transactional
    public boolean resolveAlert(Long alertId) {
        boolean resolved = inventoryDao.resolveAlert(alertId);
        if (!resolved) {
            throw new BadRequestException("Open alert not found with ID: " + alertId);
        }
        return true;
    }

    @Override
    @Transactional
    public InventoryDto replenishStock(StockReplenishmentRequest request) {
        if (request.getQuantity() == null || request.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Replenishment quantity must be greater than zero.");
        }

        // Verify product inventory exists
        getInventoryByProductId(request.getProductId());

        // Execute Member 3 stored procedure sp_add_stock
        inventoryDao.addStock(request.getProductId(), request.getQuantity(), request.getActorId());

        return getInventoryByProductId(request.getProductId());
    }

    @Override
    @Transactional
    public AtomicDecrementResponse atomicDecrement(AtomicDecrementRequest request) {
        if (request.getDeductQuantity() == null || request.getDeductQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Deduct quantity must be greater than zero.");
        }

        InventoryDto before = getInventoryByProductId(request.getProductId());

        // Execute Member 3 concurrency procedure sp_atomic_stock_decrement
        boolean success = inventoryDao.atomicStockDecrement(request.getProductId(), request.getDeductQuantity());

        InventoryDto after = getInventoryByProductId(request.getProductId());

        String message = success 
            ? "Stock successfully decremented via sp_atomic_stock_decrement." 
            : "Atomic decrement rejected: Insufficient stock available (" + before.getStockQuantity() + " available, requested " + request.getDeductQuantity() + ").";

        return new AtomicDecrementResponse(
            request.getProductId(),
            request.getDeductQuantity(),
            success,
            after.getStockQuantity(),
            message
        );
    }

    @Override
    @Transactional
    public InventoryDto updateThreshold(Long productId, BigDecimal newThreshold) {
        if (newThreshold == null || newThreshold.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Threshold cannot be negative.");
        }

        getInventoryByProductId(productId);
        inventoryDao.updateThreshold(productId, newThreshold);
        return getInventoryByProductId(productId);
    }
}

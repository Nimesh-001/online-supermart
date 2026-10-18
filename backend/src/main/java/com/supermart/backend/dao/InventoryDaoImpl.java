package com.supermart.backend.dao;

import com.supermart.backend.dto.InventoryDto;
import com.supermart.backend.dto.LowStockAlertDto;
import com.supermart.backend.dto.LowStockReportDto;
import com.supermart.backend.dto.StockMovementDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class InventoryDaoImpl implements InventoryDao {

    private final JdbcTemplate jdbcTemplate;

    public InventoryDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<InventoryDto> inventoryRowMapper = (rs, rowNum) -> {
        InventoryDto dto = new InventoryDto();
        dto.setProductId(rs.getLong("product_id"));
        dto.setProductName(rs.getString("product_name"));
        dto.setCategoryName(rs.getString("category_name"));
        dto.setSellingUnit(rs.getString("selling_unit"));
        dto.setStockQuantity(rs.getBigDecimal("stock_quantity"));
        dto.setLowStockThreshold(rs.getBigDecimal("low_stock_threshold"));
        dto.setStockStatus(rs.getString("stock_status"));
        Timestamp ts = rs.getTimestamp("updated_at");
        if (ts != null) {
            dto.setUpdatedAt(ts.toLocalDateTime());
        }
        return dto;
    };

    @Override
    public List<InventoryDto> findAllInventory() {
        String sql = 
            "SELECT inv.product_id, p.product_name, c.category_name, p.selling_unit, " +
            "       inv.stock_quantity, inv.low_stock_threshold, " +
            "       fn_get_stock_status(inv.product_id) AS stock_status, inv.updated_at " +
            "FROM inventory inv " +
            "JOIN products p ON inv.product_id = p.product_id " +
            "JOIN categories c ON p.category_id = c.category_id " +
            "ORDER BY inv.stock_quantity ASC, p.product_id ASC";

        return jdbcTemplate.query(sql, inventoryRowMapper);
    }

    @Override
    public Optional<InventoryDto> findInventoryByProductId(Long productId) {
        String sql = 
            "SELECT inv.product_id, p.product_name, c.category_name, p.selling_unit, " +
            "       inv.stock_quantity, inv.low_stock_threshold, " +
            "       fn_get_stock_status(inv.product_id) AS stock_status, inv.updated_at " +
            "FROM inventory inv " +
            "JOIN products p ON inv.product_id = p.product_id " +
            "JOIN categories c ON p.category_id = c.category_id " +
            "WHERE inv.product_id = ?";

        List<InventoryDto> results = jdbcTemplate.query(sql, inventoryRowMapper, productId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    @Override
    public List<LowStockReportDto> findLowStockReport() {
        // Queries MySQL View v_low_stock_report directly (Member 3 academic view)
        String sql = 
            "SELECT product_id, product_name, category_name, stock_quantity, low_stock_threshold " +
            "FROM v_low_stock_report " +
            "ORDER BY stock_quantity ASC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new LowStockReportDto(
            rs.getLong("product_id"),
            rs.getString("product_name"),
            rs.getString("category_name"),
            rs.getBigDecimal("stock_quantity"),
            rs.getBigDecimal("low_stock_threshold")
        ));
    }

    @Override
    public List<StockMovementDto> findRecentMovements(int limit) {
        String sql = 
            "SELECT sm.movement_id, sm.product_id, p.product_name, sm.actor_user_id, " +
            "       CONCAT(u.first_name, ' ', u.last_name) AS actor_name, " +
            "       sm.movement_type, sm.quantity_change, sm.reference_type, sm.reference_id, " +
            "       sm.notes, sm.created_at " +
            "FROM stock_movements sm " +
            "JOIN products p ON sm.product_id = p.product_id " +
            "LEFT JOIN users u ON sm.actor_user_id = u.user_id " +
            "ORDER BY sm.movement_id DESC " +
            "LIMIT ?";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            StockMovementDto dto = new StockMovementDto();
            dto.setMovementId(rs.getLong("movement_id"));
            dto.setProductId(rs.getLong("product_id"));
            dto.setProductName(rs.getString("product_name"));
            
            long actorId = rs.getLong("actor_user_id");
            if (!rs.wasNull()) {
                dto.setActorUserId(actorId);
                dto.setActorName(rs.getString("actor_name"));
            } else {
                dto.setActorName("System / Guest Automation");
            }
            
            dto.setMovementType(rs.getString("movement_type"));
            dto.setQuantityChange(rs.getBigDecimal("quantity_change"));
            dto.setReferenceType(rs.getString("reference_type"));
            
            long refId = rs.getLong("reference_id");
            if (!rs.wasNull()) {
                dto.setReferenceId(refId);
            }
            dto.setNotes(rs.getString("notes"));
            
            Timestamp ts = rs.getTimestamp("created_at");
            if (ts != null) {
                dto.setCreatedAt(ts.toLocalDateTime());
            }
            return dto;
        }, limit);
    }

    @Override
    public List<LowStockAlertDto> findAlerts(String status) {
        StringBuilder sql = new StringBuilder(
            "SELECT a.alert_id, a.product_id, p.product_name, a.stock_quantity, " +
            "       a.threshold_quantity, a.alert_status, a.created_at, a.resolved_at " +
            "FROM low_stock_alerts a " +
            "JOIN products p ON a.product_id = p.product_id "
        );

        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
            sql.append("WHERE a.alert_status = ? ");
            sql.append("ORDER BY a.alert_id DESC");
            return jdbcTemplate.query(sql.toString(), alertRowMapper, status.trim().toUpperCase());
        }

        sql.append("ORDER BY a.alert_id DESC");
        return jdbcTemplate.query(sql.toString(), alertRowMapper);
    }

    private final RowMapper<LowStockAlertDto> alertRowMapper = (rs, rowNum) -> {
        LowStockAlertDto dto = new LowStockAlertDto();
        dto.setAlertId(rs.getLong("alert_id"));
        dto.setProductId(rs.getLong("product_id"));
        dto.setProductName(rs.getString("product_name"));
        dto.setStockQuantity(rs.getBigDecimal("stock_quantity"));
        dto.setThresholdQuantity(rs.getBigDecimal("threshold_quantity"));
        dto.setAlertStatus(rs.getString("alert_status"));
        
        Timestamp cAt = rs.getTimestamp("created_at");
        if (cAt != null) {
            dto.setCreatedAt(cAt.toLocalDateTime());
        }
        
        Timestamp rAt = rs.getTimestamp("resolved_at");
        if (rAt != null) {
            dto.setResolvedAt(rAt.toLocalDateTime());
        }
        return dto;
    };

    @Override
    public boolean resolveAlert(Long alertId) {
        String sql = "UPDATE low_stock_alerts SET alert_status = 'RESOLVED', resolved_at = NOW() WHERE alert_id = ? AND alert_status = 'OPEN'";
        int rows = jdbcTemplate.update(sql, alertId);
        return rows > 0;
    }

    @Override
    public void addStock(Long productId, BigDecimal quantity, Long actorId) {
        // Calls Member 3 stored procedure sp_add_stock
        String sql = "CALL sp_add_stock(?, ?, ?)";
        jdbcTemplate.update(sql, productId, quantity, actorId);
    }

    @Override
    public boolean atomicStockDecrement(Long productId, BigDecimal deductQuantity) {
        // Calls Member 3 concurrency procedure sp_atomic_stock_decrement with OUT parameter
        return jdbcTemplate.execute((java.sql.Connection con) -> {
            try (CallableStatement cstmt = con.prepareCall("{CALL sp_atomic_stock_decrement(?, ?, ?)}")) {
                cstmt.setLong(1, productId);
                cstmt.setBigDecimal(2, deductQuantity);
                cstmt.registerOutParameter(3, Types.BOOLEAN);
                cstmt.execute();
                return cstmt.getBoolean(3);
            }
        });
    }

    @Override
    public void updateThreshold(Long productId, BigDecimal newThreshold) {
        String sql = "UPDATE inventory SET low_stock_threshold = ?, updated_at = NOW() WHERE product_id = ?";
        jdbcTemplate.update(sql, newThreshold, productId);
    }

    @Override
    public String getStockStatus(Long productId) {
        // Calls Member 3 stored function fn_get_stock_status
        String sql = "SELECT fn_get_stock_status(?)";
        return jdbcTemplate.queryForObject(sql, String.class, productId);
    }
}

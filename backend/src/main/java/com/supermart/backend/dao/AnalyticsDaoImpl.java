package com.supermart.backend.dao;

import com.supermart.backend.dto.AuditLogDto;
import com.supermart.backend.dto.ExecutiveKpiDto;
import com.supermart.backend.dto.SalesSummaryDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;

@Repository
public class AnalyticsDaoImpl implements AnalyticsDao {

    private final JdbcTemplate jdbcTemplate;

    public AnalyticsDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<SalesSummaryDto> salesSummaryRowMapper = (rs, rowNum) -> {
        SalesSummaryDto dto = new SalesSummaryDto();
        if (rs.getDate("summary_date") != null) {
            dto.setSummaryDate(rs.getDate("summary_date").toLocalDate());
        }
        dto.setCompletedOrderCount(rs.getInt("completed_order_count"));
        dto.setGrossSales(rs.getBigDecimal("gross_sales"));
        dto.setDiscountsTotal(rs.getBigDecimal("discounts_total"));
        dto.setNetSales(rs.getBigDecimal("net_sales"));
        return dto;
    };

    private final RowMapper<AuditLogDto> auditLogRowMapper = (rs, rowNum) -> {
        AuditLogDto dto = new AuditLogDto();
        dto.setAuditId(rs.getLong("audit_id"));
        long actor = rs.getLong("actor_user_id");
        if (!rs.wasNull()) dto.setActorUserId(actor);
        dto.setActionType(rs.getString("action_type"));
        dto.setEntityName(rs.getString("entity_name"));
        dto.setEntityId(rs.getString("entity_id"));
        dto.setOldValues(rs.getString("old_values"));
        dto.setNewValues(rs.getString("new_values"));
        dto.setDescription(rs.getString("description"));
        dto.setIpAddress(rs.getString("ip_address"));
        if (rs.getTimestamp("created_at") != null) {
            dto.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
        }
        return dto;
    };

    @Override
    public List<SalesSummaryDto> getSalesOverview() {
        String sql = "SELECT * FROM v_admin_sales_overview ORDER BY summary_date DESC";
        return jdbcTemplate.query(sql, salesSummaryRowMapper);
    }

    @Override
    public BigDecimal getDailyRevenue(LocalDate date) {
        String sql = "SELECT fn_get_daily_revenue(?)";
        BigDecimal rev = jdbcTemplate.queryForObject(sql, BigDecimal.class, Date.valueOf(date));
        return rev != null ? rev : BigDecimal.ZERO;
    }

    @Override
    public void runDailySalesSummary(LocalDate date) {
        String callSql = "{CALL sp_daily_sales_summary(?)}";
        jdbcTemplate.execute(callSql, (CallableStatement cs) -> {
            cs.setDate(1, Date.valueOf(date));
            return cs.execute();
        });
    }

    @Override
    public List<AuditLogDto> getAuditLogs(int limit) {
        String sql = "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?";
        return jdbcTemplate.query(sql, auditLogRowMapper, limit > 0 ? limit : 50);
    }

    @Override
    public ExecutiveKpiDto getExecutiveKpis() {
        ExecutiveKpiDto kpi = new ExecutiveKpiDto();

        // Orders metrics
        String orderSql = "SELECT " +
                "COUNT(*) AS total_orders, " +
                "SUM(CASE WHEN order_status IN ('CONFIRMED', 'PROCESSING', 'COMPLETED') THEN 1 ELSE 0 END) AS completed_orders, " +
                "SUM(CASE WHEN order_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders, " +
                "IFNULL(SUM(CASE WHEN order_status IN ('CONFIRMED', 'PROCESSING', 'COMPLETED') THEN subtotal ELSE 0 END), 0) AS gross_rev, " +
                "IFNULL(SUM(CASE WHEN order_status IN ('CONFIRMED', 'PROCESSING', 'COMPLETED') THEN total_amount ELSE 0 END), 0) AS net_rev " +
                "FROM orders";

        jdbcTemplate.query(orderSql, rs -> {
            kpi.setTotalOrders(rs.getLong("total_orders"));
            kpi.setCompletedOrders(rs.getLong("completed_orders"));
            kpi.setPendingOrders(rs.getLong("pending_orders"));
            kpi.setTotalGrossRevenue(rs.getBigDecimal("gross_rev"));
            kpi.setTotalNetRevenue(rs.getBigDecimal("net_rev"));
        });

        // Customer count
        String userSql = "SELECT COUNT(*) FROM users u " +
                "JOIN user_roles ur ON u.user_id = ur.user_id " +
                "JOIN roles r ON ur.role_id = r.role_id " +
                "WHERE r.role_name = 'CUSTOMER'";
        Long custCount = jdbcTemplate.queryForObject(userSql, Long.class);
        kpi.setTotalCustomers(custCount != null ? custCount : 0L);

        // Today's revenue via fn_get_daily_revenue
        try {
            kpi.setTodayRevenue(getDailyRevenue(LocalDate.now()));
        } catch (Exception e) {
            kpi.setTodayRevenue(BigDecimal.ZERO);
        }

        return kpi;
    }
}

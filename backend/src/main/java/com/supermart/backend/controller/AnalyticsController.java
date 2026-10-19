package com.supermart.backend.controller;

import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.dto.AuditLogDto;
import com.supermart.backend.dto.DailyRevenueDto;
import com.supermart.backend.dto.ExecutiveKpiDto;
import com.supermart.backend.dto.SalesSummaryDto;
import com.supermart.backend.exception.UnauthorizedException;
import com.supermart.backend.service.AnalyticsService;
import com.supermart.backend.service.CustomerAuthServiceImpl;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    private void enforceStaffAccess(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session == null || session.getAttribute(CustomerAuthServiceImpl.SESSION_USER_ROLE) == null) {
            throw new UnauthorizedException("Authentication required. Please sign in to staff portal.");
        }
        String role = (String) session.getAttribute(CustomerAuthServiceImpl.SESSION_USER_ROLE);
        if (!"SUPER_ADMIN".equals(role) && !"OPERATIONAL_MANAGER".equals(role)) {
            throw new UnauthorizedException("Access Denied: Executive or Staff privileges required.");
        }
    }

    /**
     * Member 6 View: v_admin_sales_overview
     */
    @GetMapping("/sales-overview")
    public ResponseEntity<ApiResponse<List<SalesSummaryDto>>> getSalesOverview(HttpServletRequest httpRequest) {
        enforceStaffAccess(httpRequest);
        List<SalesSummaryDto> overview = analyticsService.getSalesOverview();
        return ResponseEntity.ok(ApiResponse.success("Sales overview retrieved from view v_admin_sales_overview.", overview));
    }

    /**
     * Member 6 Function: fn_get_daily_revenue
     */
    @GetMapping("/daily-revenue")
    public ResponseEntity<ApiResponse<DailyRevenueDto>> getDailyRevenue(
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            HttpServletRequest httpRequest) {

        enforceStaffAccess(httpRequest);
        LocalDate targetDate = date != null ? date : LocalDate.now();
        DailyRevenueDto rev = analyticsService.getDailyRevenue(targetDate);
        return ResponseEntity.ok(ApiResponse.success("Daily revenue computed via fn_get_daily_revenue.", rev));
    }

    /**
     * Member 6 Stored Procedure: sp_daily_sales_summary
     */
    @PostMapping("/reconcile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> runReconciliation(
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            HttpServletRequest httpRequest) {

        enforceStaffAccess(httpRequest);
        LocalDate targetDate = date != null ? date : LocalDate.now();
        analyticsService.runDailySalesSummary(targetDate);
        return ResponseEntity.ok(ApiResponse.success("Daily sales reconciliation executed successfully via sp_daily_sales_summary.", Map.of(
                "reconciledDate", targetDate.toString(),
                "status", "RECONCILED",
                "triggeredByProcedure", "sp_daily_sales_summary"
        )));
    }

    /**
     * Member 6 Audit Logs (Trigger trg_audit_user_update trail)
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AuditLogDto>>> getAuditLogs(
            @RequestParam(name = "limit", defaultValue = "50") int limit,
            HttpServletRequest httpRequest) {

        enforceStaffAccess(httpRequest);
        List<AuditLogDto> logs = analyticsService.getAuditLogs(limit);
        return ResponseEntity.ok(ApiResponse.success("System audit logs retrieved.", logs));
    }

    /**
     * Executive KPI Overview
     */
    @GetMapping("/executive-kpis")
    public ResponseEntity<ApiResponse<ExecutiveKpiDto>> getExecutiveKpis(HttpServletRequest httpRequest) {
        enforceStaffAccess(httpRequest);
        ExecutiveKpiDto kpis = analyticsService.getExecutiveKpis();
        return ResponseEntity.ok(ApiResponse.success("Executive KPIs retrieved.", kpis));
    }
}

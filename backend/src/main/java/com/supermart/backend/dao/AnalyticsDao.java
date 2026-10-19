package com.supermart.backend.dao;

import com.supermart.backend.dto.AuditLogDto;
import com.supermart.backend.dto.ExecutiveKpiDto;
import com.supermart.backend.dto.SalesSummaryDto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface AnalyticsDao {
    List<SalesSummaryDto> getSalesOverview();
    BigDecimal getDailyRevenue(LocalDate date);
    void runDailySalesSummary(LocalDate date);
    List<AuditLogDto> getAuditLogs(int limit);
    ExecutiveKpiDto getExecutiveKpis();
}

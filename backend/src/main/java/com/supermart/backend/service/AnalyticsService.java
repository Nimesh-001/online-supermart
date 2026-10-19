package com.supermart.backend.service;

import com.supermart.backend.dto.AuditLogDto;
import com.supermart.backend.dto.DailyRevenueDto;
import com.supermart.backend.dto.ExecutiveKpiDto;
import com.supermart.backend.dto.SalesSummaryDto;

import java.time.LocalDate;
import java.util.List;

public interface AnalyticsService {
    List<SalesSummaryDto> getSalesOverview();
    DailyRevenueDto getDailyRevenue(LocalDate date);
    void runDailySalesSummary(LocalDate date);
    List<AuditLogDto> getAuditLogs(int limit);
    ExecutiveKpiDto getExecutiveKpis();
}

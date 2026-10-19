package com.supermart.backend.service;

import com.supermart.backend.dao.AnalyticsDao;
import com.supermart.backend.dto.AuditLogDto;
import com.supermart.backend.dto.DailyRevenueDto;
import com.supermart.backend.dto.ExecutiveKpiDto;
import com.supermart.backend.dto.SalesSummaryDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    private final AnalyticsDao analyticsDao;

    public AnalyticsServiceImpl(AnalyticsDao analyticsDao) {
        this.analyticsDao = analyticsDao;
    }

    @Override
    public List<SalesSummaryDto> getSalesOverview() {
        return analyticsDao.getSalesOverview();
    }

    @Override
    public DailyRevenueDto getDailyRevenue(LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        BigDecimal rev = analyticsDao.getDailyRevenue(target);
        return new DailyRevenueDto(target, rev);
    }

    @Override
    public void runDailySalesSummary(LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        analyticsDao.runDailySalesSummary(target);
    }

    @Override
    public List<AuditLogDto> getAuditLogs(int limit) {
        return analyticsDao.getAuditLogs(limit);
    }

    @Override
    public ExecutiveKpiDto getExecutiveKpis() {
        return analyticsDao.getExecutiveKpis();
    }
}

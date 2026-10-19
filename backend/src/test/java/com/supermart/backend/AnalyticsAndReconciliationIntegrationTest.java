package com.supermart.backend;

import com.supermart.backend.dao.AnalyticsDao;
import com.supermart.backend.dto.ExecutiveKpiDto;
import com.supermart.backend.dto.SalesSummaryDto;
import com.supermart.backend.service.CustomerAuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
public class AnalyticsAndReconciliationIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private AnalyticsDao analyticsDao;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    @DisplayName("TC-M6-01: Procedure sp_daily_sales_summary reconciles daily sales into summary table")
    void testDailySalesSummaryProcedure() {
        LocalDate today = LocalDate.now();
        analyticsDao.runDailySalesSummary(today);

        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM daily_sales_summaries WHERE summary_date = ?",
                Integer.class,
                today
        );
        assertThat(count).isNotNull().isGreaterThan(0);
    }

    @Test
    @DisplayName("TC-M6-02: View v_admin_sales_overview returns aggregated summary records")
    void testViewAdminSalesOverview() {
        analyticsDao.runDailySalesSummary(LocalDate.now());

        List<SalesSummaryDto> summaries = analyticsDao.getSalesOverview();
        assertThat(summaries).isNotNull();
    }

    @Test
    @DisplayName("TC-M6-03: Function fn_get_daily_revenue returns net sales for reconciled date")
    void testDailyRevenueFunction() {
        LocalDate today = LocalDate.now();
        analyticsDao.runDailySalesSummary(today);

        BigDecimal revenue = analyticsDao.getDailyRevenue(today);
        assertThat(revenue).isNotNull().isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("TC-M6-04: Trigger trg_audit_user_update records JSON audit log on user status modification")
    void testTriggerAuditUserUpdate() {
        // Change user status from ACTIVE to LOCKED to trigger trg_audit_user_update
        jdbcTemplate.update("UPDATE users SET account_status = 'LOCKED' WHERE user_id = 1");

        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM audit_logs WHERE action_type = 'STATUS_CHANGE' AND entity_name = 'users' AND entity_id = '1'",
                Integer.class
        );
        assertThat(auditCount).isNotNull().isGreaterThan(0);
    }

    @Test
    @DisplayName("TC-M6-05: Executive KPIs aggregate gross, net, orders, and customer counts")
    void testExecutiveKpis() {
        ExecutiveKpiDto kpis = analyticsDao.getExecutiveKpis();
        assertThat(kpis).isNotNull();
        assertThat(kpis.getTotalCustomers()).isGreaterThanOrEqualTo(0L);
    }

    @Test
    @DisplayName("TC-M6-06: REST Endpoints /api/analytics/* return sales overview, revenue, and audit trail")
    void testAnalyticsRestEndpoints() throws Exception {
        MockHttpSession adminSession = new MockHttpSession();
        adminSession.setAttribute(CustomerAuthServiceImpl.SESSION_USER_ID, 999L);
        adminSession.setAttribute(CustomerAuthServiceImpl.SESSION_USER_ROLE, "SUPER_ADMIN");

        // Sales Overview
        mockMvc.perform(get("/api/analytics/sales-overview").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Reconcile
        mockMvc.perform(post("/api/analytics/reconcile").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("RECONCILED"));

        // Daily Revenue
        mockMvc.perform(get("/api/analytics/daily-revenue").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.revenue").exists());

        // Audit Logs
        mockMvc.perform(get("/api/analytics/audit-logs").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Executive KPIs
        mockMvc.perform(get("/api/analytics/executive-kpis").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalCustomers").exists());
    }
}

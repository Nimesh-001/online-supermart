package com.supermart.backend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
public class AdminUserIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    @DisplayName("Admin: Get all users returns registered accounts")
    void testGetAllUsers() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data", hasSize(greaterThan(0))));
    }

    @Test
    @DisplayName("Admin: Create staff user with OPERATIONAL_MANAGER role")
    void testCreateStaffUser() throws Exception {
        long timestamp = System.currentTimeMillis();
        String json = "{"
                + "\"firstName\":\"Staff\","
                + "\"lastName\":\"Manager\","
                + "\"email\":\"staff_" + timestamp + "@supermart.com\","
                + "\"mobile\":\"+947" + (timestamp % 100000000L) + "\","
                + "\"password\":\"StaffPass@123\","
                + "\"roleName\":\"OPERATIONAL_MANAGER\","
                + "\"accountStatus\":\"ACTIVE\""
                + "}";

        mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("staff_" + timestamp + "@supermart.com"))
                .andExpect(jsonPath("$.data.role").value("OPERATIONAL_MANAGER"))
                .andExpect(jsonPath("$.data.accountStatus").value("ACTIVE"));
    }

    @Test
    @DisplayName("Admin: Toggle user status to LOCKED and back to ACTIVE")
    void testUpdateUserStatus() throws Exception {
        long timestamp = System.currentTimeMillis();
        String json = "{"
                + "\"firstName\":\"Status\","
                + "\"lastName\":\"Tester\","
                + "\"email\":\"status_" + timestamp + "@supermart.com\","
                + "\"mobile\":\"+947" + (timestamp % 100000000L) + "\","
                + "\"password\":\"StatusPass@123\","
                + "\"roleName\":\"CUSTOMER\","
                + "\"accountStatus\":\"ACTIVE\""
                + "}";

        String createRes = mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        // Extract user id from JSON
        int idx = createRes.indexOf("\"userId\":");
        int endIdx = createRes.indexOf(",", idx);
        String userIdStr = createRes.substring(idx + 9, endIdx).trim();

        // Lock user
        mockMvc.perform(put("/api/admin/users/" + userIdStr + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"LOCKED\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Unlock user
        mockMvc.perform(put("/api/admin/users/" + userIdStr + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Admin: Change user role from CUSTOMER to SUPER_ADMIN")
    void testUpdateUserRole() throws Exception {
        long timestamp = System.currentTimeMillis();
        String json = "{"
                + "\"firstName\":\"Role\","
                + "\"lastName\":\"Promotion\","
                + "\"email\":\"promote_" + timestamp + "@supermart.com\","
                + "\"mobile\":\"+947" + (timestamp % 100000000L) + "\","
                + "\"password\":\"PromotePass@123\","
                + "\"roleName\":\"CUSTOMER\","
                + "\"accountStatus\":\"ACTIVE\""
                + "}";

        String createRes = mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        int idx = createRes.indexOf("\"userId\":");
        int endIdx = createRes.indexOf(",", idx);
        String userIdStr = createRes.substring(idx + 9, endIdx).trim();

        // Promote to SUPER_ADMIN
        mockMvc.perform(put("/api/admin/users/" + userIdStr + "/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roleName\":\"SUPER_ADMIN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Admin: Get dashboard stats returns live KPIs")
    void testGetAdminStats() throws Exception {
        mockMvc.perform(get("/api/admin/stats"))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers", greaterThan(0)))
                .andExpect(jsonPath("$.data.totalProducts", greaterThan(0)))
                .andExpect(jsonPath("$.data.totalStockQuantity", greaterThan(0.0)));
    }
}

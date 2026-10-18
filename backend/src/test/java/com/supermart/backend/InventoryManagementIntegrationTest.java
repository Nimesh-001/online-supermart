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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class InventoryManagementIntegrationTest {

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
    @DisplayName("TC-M3-01: Get all inventory items with fn_get_stock_status")
    void testGetAllInventory() throws Exception {
        mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(10))))
                .andExpect(jsonPath("$.data[0].stockQuantity", notNullValue()))
                .andExpect(jsonPath("$.data[0].stockStatus", anyOf(equalTo("IN_STOCK"), equalTo("LOW_STOCK"), equalTo("OUT_OF_STOCK"))));
    }

    @Test
    @DisplayName("TC-M3-02: Get low-stock items via view v_low_stock_report")
    void testGetLowStockReport() throws Exception {
        // Ensure at least one product is low stock for testing the view
        jdbcTemplate.update("UPDATE inventory SET stock_quantity = 3.000 WHERE product_id = 7");

        mockMvc.perform(get("/api/inventory/low-stock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[?(@.productId == 7)].productName", hasItem("Crunchy Orange Carrots")));

        // Revert stock back
        jdbcTemplate.update("UPDATE inventory SET stock_quantity = 180.000 WHERE product_id = 7");
    }

    @Test
    @DisplayName("TC-M3-03: Replenish warehouse stock via sp_add_stock")
    void testReplenishStock() throws Exception {
        String json = """
                {
                    "productId": 2,
                    "quantity": 25.000,
                    "actorId": 1,
                    "notes": "Weekly broccoli harvest replenishment"
                }
                """;

        mockMvc.perform(post("/api/inventory/replenish")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.productId").value(2))
                .andExpect(jsonPath("$.data.stockQuantity", notNullValue()));
    }

    @Test
    @DisplayName("TC-M3-04: Verify stock movements ledger contains movements")
    void testGetStockMovements() throws Exception {
        // Ensure ledger has at least one movement record
        jdbcTemplate.update("INSERT INTO stock_movements (product_id, movement_type, quantity_change, reference_type, notes) VALUES (1, 'STOCK_IN', 10.000, 'TEST', 'Initial test movement')");

        mockMvc.perform(get("/api/inventory/movements"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.data[0].movementType", notNullValue()));
    }

    @Test
    @DisplayName("TC-M3-05: Concurrency atomic decrement succeeds when stock is sufficient via sp_atomic_stock_decrement")
    void testAtomicDecrementSuccess() throws Exception {
        String json = """
                {
                    "productId": 5,
                    "deductQuantity": 2.500
                }
                """;

        mockMvc.perform(post("/api/inventory/atomic-decrement")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.productId").value(5))
                .andExpect(jsonPath("$.data.remainingStock", notNullValue()));
    }

    @Test
    @DisplayName("TC-M3-06: Concurrency atomic decrement safely rolls back when stock is insufficient")
    void testAtomicDecrementInsufficientStockRollback() throws Exception {
        String json = """
                {
                    "productId": 1,
                    "deductQuantity": 999999.000
                }
                """;

        mockMvc.perform(post("/api/inventory/atomic-decrement")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.success").value(false))
                .andExpect(jsonPath("$.data.message", containsString("Insufficient stock available")));
    }

    @Test
    @DisplayName("TC-M3-07: Trigger trg_check_low_stock autonomously creates low_stock_alerts")
    void testTriggerCheckLowStockAlert() throws Exception {
        // Set stock below threshold on product 6 to fire trg_check_low_stock
        jdbcTemplate.update("UPDATE inventory SET stock_quantity = 2.000 WHERE product_id = 6");

        mockMvc.perform(get("/api/inventory/alerts").param("status", "OPEN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[?(@.productId == 6)].alertStatus", hasItem("OPEN")));

        // Revert product 6 stock
        jdbcTemplate.update("UPDATE inventory SET stock_quantity = 150.000 WHERE product_id = 6");
    }

    @Test
    @DisplayName("TC-M3-08: Resolve open low stock alert")
    void testResolveAlert() throws Exception {
        // Find an open alert ID
        Long alertId = jdbcTemplate.queryForObject(
                "SELECT alert_id FROM low_stock_alerts WHERE alert_status = 'OPEN' LIMIT 1", 
                Long.class
        );

        if (alertId != null) {
            mockMvc.perform(put("/api/inventory/alerts/" + alertId + "/resolve"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data").value("RESOLVED"));
        }
    }
}

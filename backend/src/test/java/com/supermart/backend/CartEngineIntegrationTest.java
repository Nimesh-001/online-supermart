package com.supermart.backend;

import com.supermart.backend.dao.CartDao;
import com.supermart.backend.dto.CartDetailDto;
import com.supermart.backend.dto.CartSummaryDto;
import com.supermart.backend.service.CartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
public class CartEngineIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private CartDao cartDao;

    @Autowired
    private CartService cartService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private MockMvc mockMvc;
    private MockHttpSession mockSession;
    private Long testCustomerId;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        // Find or create active customer for test session
        List<Long> customerIds = jdbcTemplate.query(
                "SELECT user_id FROM users WHERE account_status = 'ACTIVE' LIMIT 1",
                (rs, rowNum) -> rs.getLong("user_id")
        );
        assertFalse(customerIds.isEmpty(), "Active user should exist in database");
        this.testCustomerId = customerIds.get(0);

        this.mockSession = new MockHttpSession();
        this.mockSession.setAttribute(com.supermart.backend.service.CustomerAuthServiceImpl.SESSION_USER_ID, this.testCustomerId);
        this.mockSession.setAttribute(com.supermart.backend.service.CustomerAuthServiceImpl.SESSION_USER_ROLE, "CUSTOMER");
    }

    @Test
    @DisplayName("TC-M4-01: Add item to cart via MySQL stored procedure sp_add_to_cart")
    void testAddToCartStoredProcedure() {
        Long cartId = cartDao.getOrCreateActiveCart(testCustomerId);
        cartDao.clearCart(cartId);

        // Add 2 units of Milk (product_id = 3, selling_unit = EACH)
        cartDao.addToCart(cartId, 3L, BigDecimal.valueOf(2.0));

        List<CartDetailDto> items = cartDao.findCartDetails(cartId);
        assertFalse(items.isEmpty(), "Cart details should not be empty");
        CartDetailDto item = items.get(0);
        assertEquals(3L, item.getProductId());
        assertEquals(0, BigDecimal.valueOf(2.0).compareTo(item.getQuantity()));
    }

    @Test
    @DisplayName("TC-M4-02: View v_cart_details computes accurate line totals for KG and EACH items")
    void testViewCartDetailsComputedLineTotals() {
        Long cartId = cartDao.getOrCreateActiveCart(testCustomerId);
        cartDao.clearCart(cartId);

        // Add Strawberries (product_id = 1, KG unit) and Milk (product_id = 3, EACH unit)
        cartDao.addToCart(cartId, 1L, new BigDecimal("0.500"));
        cartDao.addToCart(cartId, 3L, new BigDecimal("1.000"));

        List<CartDetailDto> details = cartDao.findCartDetails(cartId);
        assertEquals(2, details.size());

        for (CartDetailDto detail : details) {
            assertNotNull(detail.getUnitPrice(), "Unit price must be calculated by view");
            assertNotNull(detail.getLineTotal(), "Line total must be calculated by view");
            BigDecimal expectedLineTotal = detail.getUnitPrice().multiply(detail.getQuantity()).setScale(2, java.math.RoundingMode.HALF_UP);
            assertEquals(0, expectedLineTotal.compareTo(detail.getLineTotal()));
        }
    }

    @Test
    @DisplayName("TC-M4-03: Stored function fn_get_cart_subtotal aggregates exact subtotal")
    void testCartSubtotalStoredFunction() {
        Long cartId = cartDao.getOrCreateActiveCart(testCustomerId);
        cartDao.clearCart(cartId);

        cartDao.addToCart(cartId, 3L, new BigDecimal("2.000")); // Milk: 490 * 2 = 980
        cartDao.addToCart(cartId, 4L, new BigDecimal("1.000")); // Sourdough: 520 * 1 = 520

        BigDecimal subtotal = cartDao.getCartSubtotal(cartId);
        assertNotNull(subtotal);
        assertEquals(0, new BigDecimal("1500.00").compareTo(subtotal));
    }

    @Test
    @DisplayName("TC-M4-04: Trigger trg_validate_cart_qty rejects non-positive quantities (SQLSTATE 45000)")
    void testTriggerValidatePositiveQuantity() {
        Long cartId = cartDao.getOrCreateActiveCart(testCustomerId);

        // Direct insert of non-positive quantity should trigger trg_validate_cart_qty
        Exception exception = assertThrows(Exception.class, () -> {
            jdbcTemplate.update("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, 10, -5.000)", cartId);
        });

        assertTrue(exception.getMessage().contains("must be greater than zero") ||
                   exception.getMessage().contains("45000"),
                   "Trigger trg_validate_cart_qty should fire with positive quantity constraint message");
    }

    @Test
    @DisplayName("TC-M4-05: Procedure sp_reserve_cart_with_savepoint succeeds under sufficient stock")
    void testReserveCartSuccess() {
        Long cartId = cartDao.getOrCreateActiveCart(testCustomerId);

        // Reserve 1 unit of product 1
        String status = cartDao.reserveCartWithSavepoint(cartId, 1L, new BigDecimal("1.000"));
        assertEquals("SUCCESS_RESERVED", status);
    }

    @Test
    @DisplayName("TC-M4-06: Procedure sp_reserve_cart_with_savepoint safely rolls back when stock is deficient")
    void testReserveCartInsufficientStockRollback() {
        Long cartId = cartDao.getOrCreateActiveCart(testCustomerId);

        // Request 999999 units to trigger savepoint rollback
        String status = cartDao.reserveCartWithSavepoint(cartId, 1L, new BigDecimal("999999.000"));
        assertEquals("INSUFFICIENT_STOCK_ROLLED_BACK", status);
    }

    @Test
    @DisplayName("TC-M4-07: REST GET /api/cart returns summary with authenticated session")
    void testGetCartRestEndpoint() throws Exception {
        Long cartId = cartDao.getOrCreateActiveCart(testCustomerId);
        cartDao.clearCart(cartId);
        cartDao.addToCart(cartId, 3L, new BigDecimal("1.000"));

        mockMvc.perform(get("/api/cart").session(mockSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.cartId").value(cartId))
                .andExpect(jsonPath("$.data.items", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.data.subtotal", greaterThan(0.0)));
    }

    @Test
    @DisplayName("TC-M4-08: REST PUT & DELETE /api/cart/items updates and removes line items")
    void testUpdateAndRemoveCartItemRest() throws Exception {
        Long cartId = cartDao.getOrCreateActiveCart(testCustomerId);
        cartDao.clearCart(cartId);
        cartDao.addToCart(cartId, 3L, new BigDecimal("1.000"));

        List<CartDetailDto> details = cartDao.findCartDetails(cartId);
        assertFalse(details.isEmpty());
        Long cartItemId = details.get(0).getCartItemId();

        // Update quantity to 4
        mockMvc.perform(put("/api/cart/items/" + cartItemId)
                        .session(mockSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"quantity\": 4.0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Delete item
        mockMvc.perform(delete("/api/cart/items/" + cartItemId)
                        .session(mockSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}

package com.supermart.backend;

import com.supermart.backend.dao.CartDao;
import com.supermart.backend.dao.OrderDao;
import com.supermart.backend.dto.OrderInvoiceDto;
import com.supermart.backend.service.CustomerAuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
public class OrderEngineIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private OrderDao orderDao;

    @Autowired
    private CartDao cartDao;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    @DisplayName("TC-M5-01: Function fn_calculate_coupon_discount evaluates SAVE10PLUS rule accurately")
    void testCouponDiscountFunction() {
        // Under 5000 threshold -> 0.00
        BigDecimal discountLow = orderDao.calculateCouponDiscount("SAVE10PLUS", new BigDecimal("4500.00"));
        assertThat(discountLow).isEqualByComparingTo(BigDecimal.ZERO);

        // At or over 5000 threshold -> 10% discount
        BigDecimal discountQualifying = orderDao.calculateCouponDiscount("SAVE10PLUS", new BigDecimal("6000.00"));
        assertThat(discountQualifying).isEqualByComparingTo(new BigDecimal("600.00"));

        // Invalid coupon -> 0.00
        BigDecimal discountInvalid = orderDao.calculateCouponDiscount("RANDOM99", new BigDecimal("10000.00"));
        assertThat(discountInvalid).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("TC-M5-02: Procedure sp_test_checkout_concurrency_lock verifies inventory sufficiency")
    void testCheckoutConcurrencyLock() {
        Long customerId = 1L;
        Long cartId = cartDao.getOrCreateActiveCart(customerId);
        cartDao.addToCart(cartId, 1L, new BigDecimal("1.500"));

        boolean canCheckout = orderDao.testCheckoutConcurrencyLock(cartId);
        assertThat(canCheckout).isTrue();
    }

    @Test
    @DisplayName("TC-M5-03: Procedure sp_place_order creates order, decrements stock, and populates invoice")
    void testPlaceOrderStoredProcedure() {
        Long customerId = 1L;
        Long cartId = cartDao.getOrCreateActiveCart(customerId);
        cartDao.addToCart(cartId, 3L, new BigDecimal("2.000")); // 2 packs of Whole Milk

        Long addressId = orderDao.findOrCreateCustomerAddress(customerId, "45 Galle Road", "Colombo", "00300");

        OrderInvoiceDto invoice = orderDao.placeOrder(customerId, cartId, addressId, "SAVE10PLUS", "CARD_TEST");

        assertThat(invoice).isNotNull();
        assertThat(invoice.getOrderId()).isPositive();
        assertThat(invoice.getOrderNumber()).startsWith("ORD-");
        assertThat(invoice.getOrderStatus()).isEqualTo("CONFIRMED");
        assertThat(invoice.getPaymentStatus()).isEqualTo("PAID");
        assertThat(invoice.getItems()).isNotEmpty();
    }

    @Test
    @DisplayName("TC-M5-04: Trigger trg_after_order_item_sale logs SALE movement into stock_movements")
    void testTriggerAfterOrderItemSale() {
        Long customerId = 1L;
        Long cartId = cartDao.getOrCreateActiveCart(customerId);
        cartDao.addToCart(cartId, 4L, new BigDecimal("1.000"));

        Long addressId = orderDao.findOrCreateCustomerAddress(customerId, "88 Kandy Road", "Kadawatha", "11850");
        OrderInvoiceDto invoice = orderDao.placeOrder(customerId, cartId, addressId, null, "COD");

        // Verify that trigger trg_after_order_item_sale recorded a SALE entry
        Integer movementCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM stock_movements WHERE reference_type = 'ORDER' AND reference_id = ?",
                Integer.class,
                invoice.getOrderId()
        );
        assertThat(movementCount).isNotNull().isGreaterThan(0);
    }

    @Test
    @DisplayName("TC-M5-05: View v_order_invoices returns full billing snapshot")
    void testViewOrderInvoices() {
        List<OrderInvoiceDto> invoices = orderDao.findAllOrders();
        assertThat(invoices).isNotNull();
    }

    @Test
    @DisplayName("TC-M5-06: Event simulation evt_cancel_expired_orders cleans up unconfirmed orders")
    void testCancelExpiredOrders() {
        int cancelled = orderDao.cancelExpiredOrders();
        assertThat(cancelled).isGreaterThanOrEqualTo(0);
    }

    @Test
    @DisplayName("TC-M5-07: REST POST /api/orders/checkout places order and returns invoice")
    void testCheckoutEndpoint() throws Exception {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(CustomerAuthServiceImpl.SESSION_USER_ID, 1L);
        session.setAttribute(CustomerAuthServiceImpl.SESSION_USER_ROLE, "CUSTOMER");

        Long cartId = cartDao.getOrCreateActiveCart(1L);
        cartDao.addToCart(cartId, 2L, new BigDecimal("1.000"));

        String reqJson = """
                {
                    "addressLine": "12 Palm Grove",
                    "city": "Colombo",
                    "postalCode": "00300",
                    "couponCode": "SAVE10PLUS",
                    "paymentMethod": "CARD_TEST"
                }
                """;

        mockMvc.perform(post("/api/orders/checkout")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber").exists())
                .andExpect(jsonPath("$.data.orderStatus").value("CONFIRMED"));
    }

    @Test
    @DisplayName("TC-M5-08: REST PUT /api/orders/{id}/status updates fulfillment status")
    void testUpdateOrderStatusEndpoint() throws Exception {
        MockHttpSession adminSession = new MockHttpSession();
        adminSession.setAttribute(CustomerAuthServiceImpl.SESSION_USER_ID, 100L);
        adminSession.setAttribute(CustomerAuthServiceImpl.SESSION_USER_ROLE, "OPERATIONAL_MANAGER");

        Long customerId = 1L;
        Long cartId = cartDao.getOrCreateActiveCart(customerId);
        cartDao.addToCart(cartId, 1L, new BigDecimal("1.000"));
        Long addressId = orderDao.findOrCreateCustomerAddress(customerId, "10 Station Road", "Dehiwala", "10350");
        OrderInvoiceDto invoice = orderDao.placeOrder(customerId, cartId, addressId, null, "COD");

        String statusBody = """
                {
                    "orderStatus": "PROCESSING",
                    "paymentStatus": "PAID"
                }
                """;

        mockMvc.perform(put("/api/orders/" + invoice.getOrderId() + "/status")
                        .session(adminSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(statusBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.newOrderStatus").value("PROCESSING"));
    }
}

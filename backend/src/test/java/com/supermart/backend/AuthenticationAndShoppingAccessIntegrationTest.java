package com.supermart.backend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class AuthenticationAndShoppingAccessIntegrationTest {

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
    @DisplayName("Should successfully authenticate with valid email and establish HttpOnly session")
    void testValidEmailLogin() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "login_email_" + timestamp + "@supermart.com";
        String mobile = "+9477" + (timestamp % 10000000L);

        // 1. Register customer
        String regJson = """
                {
                    "firstName": "Kamal",
                    "lastName": "Silva",
                    "mobile": "%s",
                    "email": "%s",
                    "password": "Password123!",
                    "confirmPassword": "Password123!"
                }
                """.formatted(mobile, email);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regJson))
                .andExpect(status().isCreated());

        // 2. Perform login using email
        String loginJson = """
                {
                    "identifier": "%s",
                    "password": "Password123!"
                }
                """.formatted(email);

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.firstName").value("Kamal"))
                .andExpect(jsonPath("$.data.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andReturn();

        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(session, "HttpSession must be established on successful login");
        assertNotNull(session.getAttribute("AUTH_USER_ID"));
        assertEquals("CUSTOMER", session.getAttribute("AUTH_USER_ROLE"));

        // 3. Verify session access via /api/auth/me
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(email));
    }

    @Test
    @DisplayName("Should successfully authenticate using mobile number as identifier")
    void testValidMobileLogin() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "mobile_login_" + timestamp + "@supermart.com";
        String mobile = "+9478" + (timestamp % 10000000L);

        String regJson = """
                {
                    "firstName": "Sunil",
                    "lastName": "Perera",
                    "mobile": "%s",
                    "email": "%s",
                    "password": "SecretPassword123!",
                    "confirmPassword": "SecretPassword123!"
                }
                """.formatted(mobile, email);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regJson))
                .andExpect(status().isCreated());

        // Login with mobile
        String loginJson = """
                {
                    "identifier": "%s",
                    "password": "SecretPassword123!"
                }
                """.formatted(mobile);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.mobile").value(mobile))
                .andExpect(jsonPath("$.data.role").value("CUSTOMER"));
    }

    @Test
    @DisplayName("Should reject invalid credentials with generic error to prevent account enumeration")
    void testInvalidCredentialsGenericError() throws Exception {
        String loginJson = """
                {
                    "identifier": "nonexistent_user@example.com",
                    "password": "WrongPassword!"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email/mobile number or password."));
    }

    @Test
    @DisplayName("Should reject login for disabled/locked accounts")
    void testDisabledAccountLoginRejected() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "locked_" + timestamp + "@supermart.com";
        String mobile = "+9470" + (timestamp % 10000000L);

        String regJson = """
                {
                    "firstName": "Locked",
                    "lastName": "User",
                    "mobile": "%s",
                    "email": "%s",
                    "password": "Password123!",
                    "confirmPassword": "Password123!"
                }
                """.formatted(mobile, email);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regJson))
                .andExpect(status().isCreated());

        // Lock the account in database
        jdbcTemplate.update("UPDATE users SET account_status = 'LOCKED' WHERE email = ?", email);

        String loginJson = """
                {
                    "identifier": "%s",
                    "password": "Password123!"
                }
                """.formatted(email);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message", containsString("locked")));
    }

    @Test
    @DisplayName("Should block guest from shopping actions (cart addition) with HTTP 401")
    void testGuestCartAccessBlocked() throws Exception {
        String cartJson = """
                {
                    "productId": 1,
                    "productName": "Organic Strawberries",
                    "quantity": 2
                }
                """;

        // Without any session
        mockMvc.perform(post("/api/cart/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cartJson))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message", containsString("Authentication required")));

        // Checkout attempt without session
        mockMvc.perform(post("/api/cart/checkout"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Should permit authenticated customer to add item to persistent cart")
    void testAuthenticatedCustomerCanAddToCart() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "shopper_" + timestamp + "@supermart.com";
        String mobile = "+9472" + (timestamp % 10000000L);

        String regJson = """
                {
                    "firstName": "Shopper",
                    "lastName": "One",
                    "mobile": "%s",
                    "email": "%s",
                    "password": "Password123!",
                    "confirmPassword": "Password123!"
                }
                """.formatted(mobile, email);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regJson))
                .andExpect(status().isCreated());

        String loginJson = """
                {
                    "identifier": "%s",
                    "password": "Password123!"
                }
                """.formatted(email);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);
        assertNotNull(session);

        String cartJson = """
                {
                    "productId": 1,
                    "productName": "Organic Strawberries",
                    "quantity": 3
                }
                """;

        mockMvc.perform(post("/api/cart/add")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cartJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.productId").value(1))
                .andExpect(jsonPath("$.data.quantity").value(3));

        // Verify cart checkout access
        mockMvc.perform(post("/api/cart/checkout").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Should successfully invalidate session on logout")
    void testLogoutInvalidatesSession() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "logout_user_" + timestamp + "@supermart.com";
        String mobile = "+9473" + (timestamp % 10000000L);

        String regJson = """
                {
                    "firstName": "Logout",
                    "lastName": "Test",
                    "mobile": "%s",
                    "email": "%s",
                    "password": "Password123!",
                    "confirmPassword": "Password123!"
                }
                """.formatted(mobile, email);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regJson))
                .andExpect(status().isCreated());

        String loginJson = """
                {
                    "identifier": "%s",
                    "password": "Password123!"
                }
                """.formatted(email);

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);
        assertNotNull(session);

        // Perform logout
        mockMvc.perform(post("/api/auth/logout").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertTrue(session.isInvalid(), "HttpSession must be invalidated after logout");

        // Subsequent session request must fail
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isUnauthorized());
    }
}

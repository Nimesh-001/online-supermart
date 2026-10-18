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
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
class CustomerRegistrationIntegrationTest {

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
    @DisplayName("Should successfully register a new customer and assign CUSTOMER role")
    void testSuccessfulRegistration() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "testuser" + timestamp + "@supermart.com";
        String mobile = "+9477" + (timestamp % 10000000L);

        String json = """
                {
                    "firstName": "John",
                    "lastName": "Doe",
                    "mobile": "%s",
                    "email": "%s",
                    "password": "SecurePassword123!",
                    "confirmPassword": "SecurePassword123!",
                    "marketingOptIn": true
                }
                """.formatted(mobile, email);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").isNumber())
                .andExpect(jsonPath("$.data.firstName").value("John"))
                .andExpect(jsonPath("$.data.lastName").value("Doe"))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.mobile").value(mobile))
                .andExpect(jsonPath("$.data.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.data.accountStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());

        // Verify in database: users table
        Integer userCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email);
        assertEquals(1, userCount);

        Long userId = jdbcTemplate.queryForObject(
                "SELECT user_id FROM users WHERE email = ?", Long.class, email);
        assertNotNull(userId);

        // Verify password is encrypted and not plain text
        String passwordHash = jdbcTemplate.queryForObject(
                "SELECT password_hash FROM users WHERE user_id = ?", String.class, userId);
        assertNotNull(passwordHash);
        assertNotEquals("SecurePassword123!", passwordHash);
        assertTrue(passwordHash.startsWith("$2a$") || passwordHash.startsWith("$2b$") || passwordHash.startsWith("$2y$"));

        // Verify customer_profile exists
        Integer profileCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM customer_profiles WHERE user_id = ?", Integer.class, userId);
        assertEquals(1, profileCount);

        // Verify user_role is assigned to CUSTOMER
        String assignedRole = jdbcTemplate.queryForObject(
                "SELECT r.role_name FROM roles r JOIN user_roles ur ON r.role_id = ur.role_id WHERE ur.user_id = ?",
                String.class, userId);
        assertEquals("CUSTOMER", assignedRole);
    }

    @Test
    @DisplayName("Should reject registration with duplicate email")
    void testDuplicateEmailRejection() throws Exception {
        long timestamp = System.currentTimeMillis();
        String email = "dup_email_" + timestamp + "@supermart.com";
        String mobile1 = "+9471" + (timestamp % 10000000L);
        String mobile2 = "+9472" + (timestamp % 10000000L);

        String json1 = """
                {
                    "firstName": "First",
                    "lastName": "User",
                    "mobile": "%s",
                    "email": "%s",
                    "password": "Password123!",
                    "confirmPassword": "Password123!"
                }
                """.formatted(mobile1, email);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json1))
                .andExpect(status().isCreated());

        String json2 = """
                {
                    "firstName": "Second",
                    "lastName": "User",
                    "mobile": "%s",
                    "email": "%s",
                    "password": "Password123!",
                    "confirmPassword": "Password123!"
                }
                """.formatted(mobile2, email);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json2))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message", containsString("already registered")));
    }

    @Test
    @DisplayName("Should reject registration with duplicate mobile")
    void testDuplicateMobileRejection() throws Exception {
        long timestamp = System.currentTimeMillis();
        String mobile = "+9476" + (timestamp % 10000000L);
        String email1 = "user1_" + timestamp + "@supermart.com";
        String email2 = "user2_" + timestamp + "@supermart.com";

        String json1 = """
                {
                    "firstName": "First",
                    "lastName": "User",
                    "mobile": "%s",
                    "email": "%s",
                    "password": "Password123!",
                    "confirmPassword": "Password123!"
                }
                """.formatted(mobile, email1);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json1))
                .andExpect(status().isCreated());

        String json2 = """
                {
                    "firstName": "Second",
                    "lastName": "User",
                    "mobile": "%s",
                    "email": "%s",
                    "password": "Password123!",
                    "confirmPassword": "Password123!"
                }
                """.formatted(mobile, email2);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json2))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message", containsString("already registered")));
    }

    @Test
    @DisplayName("Should reject registration when password and confirm password do not match")
    void testPasswordMismatch() throws Exception {
        String json = """
                {
                    "firstName": "Jane",
                    "lastName": "Doe",
                    "mobile": "+94770001122",
                    "email": "mismatch@supermart.com",
                    "password": "Password123!",
                    "confirmPassword": "DifferentPassword456!"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message", containsString("do not match")));
    }

    @Test
    @DisplayName("Should fail validation when mandatory fields are missing or invalid")
    void testFieldValidations() throws Exception {
        String json = """
                {
                    "firstName": "",
                    "lastName": "",
                    "mobile": "invalid-phone",
                    "email": "not-an-email",
                    "password": "123",
                    "confirmPassword": "123"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.firstName").exists())
                .andExpect(jsonPath("$.validationErrors.lastName").exists())
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.password").exists());
    }
}

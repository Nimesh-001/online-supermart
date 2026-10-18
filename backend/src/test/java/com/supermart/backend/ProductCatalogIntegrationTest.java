package com.supermart.backend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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
class ProductCatalogIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    @DisplayName("TC-M2-01: Get active product catalog via v_active_product_catalog")
    void testGetActiveProductCatalog() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(10))))
                .andExpect(jsonPath("$.data[?(@.sellingUnit == 'KG')].pricePer100g", everyItem(notNullValue())))
                .andExpect(jsonPath("$.data[?(@.sellingUnit == 'EACH')].pricePerItem", everyItem(notNullValue())));
    }

    @Test
    @DisplayName("TC-M2-02: Filter catalog by category")
    void testFilterCatalogByCategory() throws Exception {
        mockMvc.perform(get("/api/products").param("category", "Fresh Fruits"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.data[*].categoryName", everyItem(equalTo("Fresh Fruits"))));
    }

    @Test
    @DisplayName("TC-M2-03: Search catalog by keyword")
    void testSearchCatalogByKeyword() throws Exception {
        mockMvc.perform(get("/api/products").param("search", "Broccoli"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].productName", containsString("Broccoli")))
                .andExpect(jsonPath("$.data[0].sellingUnit", equalTo("KG")));
    }

    @Test
    @DisplayName("TC-M2-04: Get all active categories with product counts")
    void testGetCategories() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(6))))
                .andExpect(jsonPath("$.data[0].categoryName", notNullValue()))
                .andExpect(jsonPath("$.data[0].productCount", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("TC-M2-05: Get all active brands")
    void testGetBrands() throws Exception {
        mockMvc.perform(get("/api/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(4))));
    }

    @Test
    @DisplayName("TC-M2-06: Calculate price for weight produce using fn_calc_price_100g")
    void testCalculateGramPriceForKgProduct() throws Exception {
        // Product 1 (Strawberries) is 2600.00/kg. For 250g, base price is 650.00.
        // It has a 20% discount offer, so discounted price is 520.00.
        String json = """
                {
                    "productId": 1,
                    "grams": 250.0
                }
                """;

        mockMvc.perform(post("/api/products/calculate-price")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.productId").value(1))
                .andExpect(jsonPath("$.data.grams").value(250.0))
                .andExpect(jsonPath("$.data.basePrice").value(650.0))
                .andExpect(jsonPath("$.data.discountPercent").value(20.0))
                .andExpect(jsonPath("$.data.finalPrice").value(520.0));
    }

    @Test
    @DisplayName("TC-M2-07: Gram price calculation rejected for EACH unit products")
    void testCalculateGramPriceRejectedForEachProduct() throws Exception {
        // Product 3 (Milk) is EACH, cannot calculate by grams
        String json = """
                {
                    "productId": 3,
                    "grams": 500.0
                }
                """;

        mockMvc.perform(post("/api/products/calculate-price")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("sold per item (EACH), not by weight")));
    }

    @Test
    @DisplayName("TC-M2-08: Update product price via sp_update_product_price")
    void testUpdateProductPrice() throws Exception {
        String json = """
                {
                    "newPrice": 2650.00
                }
                """;

        mockMvc.perform(put("/api/products/1/price")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.pricePerKg").value(2650.0))
                .andExpect(jsonPath("$.data.pricePer100g").value(265.0));

        // Revert price back to 2600.00
        String revertJson = """
                {
                    "newPrice": 2600.00
                }
                """;
        mockMvc.perform(put("/api/products/1/price")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(revertJson))
                .andExpect(status().isOk());
    }
}

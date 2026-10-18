package com.supermart.backend.controller;

import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.dto.BrandDto;
import com.supermart.backend.dto.CategoryDto;
import com.supermart.backend.dto.GramPriceRequest;
import com.supermart.backend.dto.GramPriceResponse;
import com.supermart.backend.dto.ProductDto;
import com.supermart.backend.dto.UpdatePriceRequest;
import com.supermart.backend.service.ProductCatalogService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProductCatalogController {

    private final ProductCatalogService catalogService;

    public ProductCatalogController(ProductCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean featured) {

        List<ProductDto> products = catalogService.getCatalog(category, search, featured);
        return ResponseEntity.ok(ApiResponse.success("Catalog retrieved successfully.", products));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<ProductDto>> getProductById(@PathVariable Long id) {
        ProductDto product = catalogService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.success("Product details retrieved successfully.", product));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryDto>>> getCategories() {
        List<CategoryDto> categories = catalogService.getCategories();
        return ResponseEntity.ok(ApiResponse.success("Categories retrieved successfully.", categories));
    }

    @GetMapping("/brands")
    public ResponseEntity<ApiResponse<List<BrandDto>>> getBrands() {
        List<BrandDto> brands = catalogService.getBrands();
        return ResponseEntity.ok(ApiResponse.success("Brands retrieved successfully.", brands));
    }

    @PostMapping("/products/calculate-price")
    public ResponseEntity<ApiResponse<GramPriceResponse>> calculateGramPrice(
            @Valid @RequestBody GramPriceRequest request) {

        GramPriceResponse response = catalogService.calculateGramPrice(request.getProductId(), request.getGrams());
        return ResponseEntity.ok(ApiResponse.success("Gram price calculated successfully via fn_calc_price_100g.", response));
    }

    @PutMapping("/products/{id}/price")
    public ResponseEntity<ApiResponse<ProductDto>> updateProductPrice(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePriceRequest request) {

        ProductDto updated = catalogService.updateProductPrice(id, request.getNewPrice());
        return ResponseEntity.ok(ApiResponse.success("Product price updated successfully via sp_update_product_price.", updated));
    }
}

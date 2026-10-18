package com.supermart.backend.service;

import com.supermart.backend.dto.BrandDto;
import com.supermart.backend.dto.CategoryDto;
import com.supermart.backend.dto.GramPriceResponse;
import com.supermart.backend.dto.ProductDto;

import java.math.BigDecimal;
import java.util.List;

public interface ProductCatalogService {

    List<ProductDto> getCatalog(String category, String search, Boolean featuredOnly);

    ProductDto getProductById(Long productId);

    List<CategoryDto> getCategories();

    List<BrandDto> getBrands();

    GramPriceResponse calculateGramPrice(Long productId, BigDecimal grams);

    ProductDto updateProductPrice(Long productId, BigDecimal newPrice);
}

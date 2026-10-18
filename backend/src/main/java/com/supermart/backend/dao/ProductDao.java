package com.supermart.backend.dao;

import com.supermart.backend.dto.BrandDto;
import com.supermart.backend.dto.CategoryDto;
import com.supermart.backend.dto.ProductDto;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ProductDao {

    List<ProductDto> findActiveCatalog(String categoryName, String search, Boolean featuredOnly);

    Optional<ProductDto> findProductById(Long productId);

    List<CategoryDto> findAllCategories();

    List<BrandDto> findAllBrands();

    BigDecimal calculatePriceForGrams(Long productId, BigDecimal grams);

    void updateProductPrice(Long productId, BigDecimal newPrice);
}

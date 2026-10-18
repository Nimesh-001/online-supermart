package com.supermart.backend.service;

import com.supermart.backend.dao.ProductDao;
import com.supermart.backend.dto.BrandDto;
import com.supermart.backend.dto.CategoryDto;
import com.supermart.backend.dto.GramPriceResponse;
import com.supermart.backend.dto.ProductDto;
import com.supermart.backend.exception.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
public class ProductCatalogServiceImpl implements ProductCatalogService {

    private final ProductDao productDao;

    public ProductCatalogServiceImpl(ProductDao productDao) {
        this.productDao = productDao;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDto> getCatalog(String category, String search, Boolean featuredOnly) {
        return productDao.findActiveCatalog(category, search, featuredOnly);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDto getProductById(Long productId) {
        return productDao.findProductById(productId)
            .orElseThrow(() -> new BadRequestException("Product not found with ID: " + productId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryDto> getCategories() {
        return productDao.findAllCategories();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BrandDto> getBrands() {
        return productDao.findAllBrands();
    }

    @Override
    @Transactional(readOnly = true)
    public GramPriceResponse calculateGramPrice(Long productId, BigDecimal grams) {
        if (grams == null || grams.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Weight must be greater than zero grams.");
        }

        ProductDto product = getProductById(productId);

        if (!"KG".equalsIgnoreCase(product.getSellingUnit())) {
            throw new BadRequestException("Product '" + product.getProductName() + "' is sold per item (EACH), not by weight.");
        }

        BigDecimal calculatedBasePrice = productDao.calculatePriceForGrams(productId, grams);

        BigDecimal finalPrice = calculatedBasePrice;
        BigDecimal discountPercent = product.getDiscountPercent();
        if (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal multiplier = BigDecimal.ONE.subtract(discountPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            finalPrice = calculatedBasePrice.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        }

        return new GramPriceResponse(
            product.getProductId(),
            product.getProductName(),
            grams,
            calculatedBasePrice,
            discountPercent != null ? discountPercent : BigDecimal.ZERO,
            finalPrice
        );
    }

    @Override
    @Transactional
    public ProductDto updateProductPrice(Long productId, BigDecimal newPrice) {
        if (newPrice == null || newPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Price must be strictly positive.");
        }

        // Verify product exists
        getProductById(productId);

        // Execute stored procedure
        productDao.updateProductPrice(productId, newPrice);

        return getProductById(productId);
    }
}

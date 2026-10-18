package com.supermart.backend.dao;

import com.supermart.backend.dto.BrandDto;
import com.supermart.backend.dto.CategoryDto;
import com.supermart.backend.dto.ProductDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class ProductDaoImpl implements ProductDao {

    private final JdbcTemplate jdbcTemplate;

    public ProductDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<ProductDto> productRowMapper = (rs, rowNum) -> {
        ProductDto dto = new ProductDto();
        dto.setProductId(rs.getLong("product_id"));
        dto.setProductName(rs.getString("product_name"));
        dto.setDescription(rs.getString("description"));
        dto.setCategoryId(rs.getLong("category_id"));
        dto.setCategoryName(rs.getString("category_name"));
        
        long brandId = rs.getLong("brand_id");
        if (!rs.wasNull()) {
            dto.setBrandId(brandId);
        }
        dto.setBrandName(rs.getString("brand_name"));
        dto.setSellingUnit(rs.getString("selling_unit"));
        
        BigDecimal pricePerKg = rs.getBigDecimal("price_per_kg");
        dto.setPricePerKg(pricePerKg);
        
        BigDecimal pricePer100g = rs.getBigDecimal("price_per_100g");
        dto.setPricePer100g(pricePer100g);
        
        BigDecimal pricePerItem = rs.getBigDecimal("price_per_item");
        dto.setPricePerItem(pricePerItem);
        
        BigDecimal effectivePrice = "KG".equalsIgnoreCase(dto.getSellingUnit()) ? pricePerKg : pricePerItem;
        dto.setEffectivePrice(effectivePrice);
        
        dto.setImageUrl(rs.getString("image_url"));
        dto.setIsFeatured(rs.getBoolean("is_featured"));
        
        dto.setOfferName(rs.getString("offer_name"));
        BigDecimal discountPercent = rs.getBigDecimal("discount_percent");
        dto.setDiscountPercent(discountPercent);
        
        if (effectivePrice != null && discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discountMultiplier = BigDecimal.ONE.subtract(discountPercent.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            dto.setDiscountedPrice(effectivePrice.multiply(discountMultiplier).setScale(2, RoundingMode.HALF_UP));
        } else {
            dto.setDiscountedPrice(effectivePrice);
        }
        
        dto.setStockQuantity(rs.getBigDecimal("stock_quantity"));
        dto.setStockStatus(rs.getString("stock_status"));
        
        return dto;
    };

    @Override
    public List<ProductDto> findActiveCatalog(String categoryName, String search, Boolean featuredOnly) {
        StringBuilder sql = new StringBuilder(
            "SELECT " +
            "  v.product_id, v.product_name, p.description, p.category_id, v.category_name, " +
            "  p.brand_id, v.brand_name, v.selling_unit, v.price_per_kg, v.price_per_100g, " +
            "  v.price_per_item, v.image_url, v.is_featured, " +
            "  po.offer_name, po.discount_percent, " +
            "  inv.stock_quantity, fn_get_stock_status(v.product_id) AS stock_status " +
            "FROM v_active_product_catalog v " +
            "JOIN products p ON v.product_id = p.product_id " +
            "LEFT JOIN inventory inv ON v.product_id = inv.product_id " +
            "LEFT JOIN product_offers po ON (v.product_id = po.product_id AND po.is_active = TRUE AND NOW() BETWEEN po.starts_at AND po.ends_at) " +
            "WHERE 1=1 "
        );

        List<Object> params = new ArrayList<>();

        if (categoryName != null && !categoryName.trim().isEmpty() && !"all".equalsIgnoreCase(categoryName.trim())) {
            sql.append("AND LOWER(v.category_name) = LOWER(?) ");
            params.add(categoryName.trim());
        }

        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (LOWER(v.product_name) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?) OR LOWER(v.brand_name) LIKE LOWER(?)) ");
            String term = "%" + search.trim() + "%";
            params.add(term);
            params.add(term);
            params.add(term);
        }

        if (Boolean.TRUE.equals(featuredOnly)) {
            sql.append("AND v.is_featured = TRUE ");
        }

        sql.append("ORDER BY v.is_featured DESC, v.product_id ASC");

        return jdbcTemplate.query(sql.toString(), productRowMapper, params.toArray());
    }

    @Override
    public Optional<ProductDto> findProductById(Long productId) {
        String sql = 
            "SELECT " +
            "  v.product_id, v.product_name, p.description, p.category_id, v.category_name, " +
            "  p.brand_id, v.brand_name, v.selling_unit, v.price_per_kg, v.price_per_100g, " +
            "  v.price_per_item, v.image_url, v.is_featured, " +
            "  po.offer_name, po.discount_percent, " +
            "  inv.stock_quantity, fn_get_stock_status(v.product_id) AS stock_status " +
            "FROM v_active_product_catalog v " +
            "JOIN products p ON v.product_id = p.product_id " +
            "LEFT JOIN inventory inv ON v.product_id = inv.product_id " +
            "LEFT JOIN product_offers po ON (v.product_id = po.product_id AND po.is_active = TRUE AND NOW() BETWEEN po.starts_at AND po.ends_at) " +
            "WHERE v.product_id = ?";

        List<ProductDto> results = jdbcTemplate.query(sql, productRowMapper, productId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    @Override
    public List<CategoryDto> findAllCategories() {
        String sql = 
            "SELECT c.category_id, c.category_name, c.description, COUNT(p.product_id) AS product_count " +
            "FROM categories c " +
            "LEFT JOIN products p ON (c.category_id = p.category_id AND p.product_status = 'ACTIVE') " +
            "WHERE c.is_active = TRUE " +
            "GROUP BY c.category_id, c.category_name, c.description " +
            "ORDER BY c.category_id ASC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            CategoryDto dto = new CategoryDto();
            dto.setCategoryId(rs.getLong("category_id"));
            String name = rs.getString("category_name");
            dto.setCategoryName(name);
            dto.setDescription(rs.getString("description"));
            dto.setProductCount(rs.getInt("product_count"));

            // Map standard icons for categories
            if (name.contains("Fruit")) dto.setIcon("🍎");
            else if (name.contains("Vegetable")) dto.setIcon("🥦");
            else if (name.contains("Dairy")) dto.setIcon("🧀");
            else if (name.contains("Bakery")) dto.setIcon("🥖");
            else if (name.contains("Pantry")) dto.setIcon("🍚");
            else if (name.contains("Beverage")) dto.setIcon("🧃");
            else dto.setIcon("🛒");

            return dto;
        });
    }

    @Override
    public List<BrandDto> findAllBrands() {
        String sql = 
            "SELECT b.brand_id, b.brand_name, COUNT(p.product_id) AS product_count " +
            "FROM brands b " +
            "LEFT JOIN products p ON (b.brand_id = p.brand_id AND p.product_status = 'ACTIVE') " +
            "WHERE b.is_active = TRUE " +
            "GROUP BY b.brand_id, b.brand_name " +
            "ORDER BY b.brand_name ASC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> 
            new BrandDto(rs.getLong("brand_id"), rs.getString("brand_name"), rs.getInt("product_count"))
        );
    }

    @Override
    public BigDecimal calculatePriceForGrams(Long productId, BigDecimal grams) {
        String sql = "SELECT fn_calc_price_100g(?, ?)";
        BigDecimal price = jdbcTemplate.queryForObject(sql, BigDecimal.class, productId, grams);
        return price != null ? price : BigDecimal.ZERO;
    }

    @Override
    public void updateProductPrice(Long productId, BigDecimal newPrice) {
        String sql = "CALL sp_update_product_price(?, ?)";
        jdbcTemplate.update(sql, productId, newPrice);
    }
}

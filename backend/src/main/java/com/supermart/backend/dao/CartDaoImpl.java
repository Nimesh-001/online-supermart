package com.supermart.backend.dao;

import com.supermart.backend.dto.CartDetailDto;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Types;
import java.util.List;
import java.util.Optional;

@Repository
public class CartDaoImpl implements CartDao {

    private final JdbcTemplate jdbcTemplate;

    public CartDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<CartDetailDto> cartDetailRowMapper = (rs, rowNum) -> new CartDetailDto(
            rs.getLong("cart_id"),
            rs.getLong("customer_id"),
            rs.getLong("cart_item_id"),
            rs.getLong("product_id"),
            rs.getString("product_name"),
            rs.getString("selling_unit"),
            rs.getBigDecimal("quantity"),
            rs.getBigDecimal("unit_price"),
            rs.getBigDecimal("line_total"),
            rs.getString("image_url")
    );

    @Override
    public Long getOrCreateActiveCart(Long customerId) {
        String querySql = "SELECT cart_id FROM carts WHERE customer_id = ? AND cart_status = 'ACTIVE' ORDER BY cart_id DESC LIMIT 1";
        try {
            Long existingCartId = jdbcTemplate.queryForObject(querySql, Long.class, customerId);
            if (existingCartId != null) {
                return existingCartId;
            }
        } catch (EmptyResultDataAccessException ignored) {
            // No active cart exists yet, create a new one
        }

        String insertSql = "INSERT INTO carts (customer_id, cart_status) VALUES (?, 'ACTIVE')";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, customerId);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to create active cart for customer ID: " + customerId);
        }
        return key.longValue();
    }

    @Override
    public List<CartDetailDto> findCartDetails(Long cartId) {
        String sql = "SELECT " +
                     "  v.cart_id, " +
                     "  v.customer_id, " +
                     "  v.cart_item_id, " +
                     "  ci.product_id, " +
                     "  v.product_name, " +
                     "  v.selling_unit, " +
                     "  v.quantity, " +
                     "  v.unit_price, " +
                     "  v.line_total, " +
                     "  p.image_url " +
                     "FROM v_cart_details v " +
                     "JOIN cart_items ci ON v.cart_item_id = ci.cart_item_id " +
                     "JOIN products p ON ci.product_id = p.product_id " +
                     "WHERE v.cart_id = ? " +
                     "ORDER BY v.cart_item_id ASC";

        return jdbcTemplate.query(sql, cartDetailRowMapper, cartId);
    }

    @Override
    public BigDecimal getCartSubtotal(Long cartId) {
        String sql = "SELECT fn_get_cart_subtotal(?)";
        BigDecimal subtotal = jdbcTemplate.queryForObject(sql, BigDecimal.class, cartId);
        return subtotal != null ? subtotal : BigDecimal.ZERO.setScale(2);
    }

    @Override
    public void addToCart(Long cartId, Long productId, BigDecimal quantity) {
        String sql = "{CALL sp_add_to_cart(?, ?, ?)}";
        jdbcTemplate.update(sql, cartId, productId, quantity);
    }

    @Override
    public String reserveCartWithSavepoint(Long cartId, Long productId, BigDecimal quantity) {
        return jdbcTemplate.execute((ConnectionCallback<String>) con -> {
            try (CallableStatement cs = con.prepareCall("{CALL sp_reserve_cart_with_savepoint(?, ?, ?, ?)}")) {
                cs.setLong(1, cartId);
                cs.setLong(2, productId);
                cs.setBigDecimal(3, quantity);
                cs.registerOutParameter(4, Types.VARCHAR);
                cs.execute();
                return cs.getString(4);
            }
        });
    }

    @Override
    public void updateCartItemQuantity(Long cartId, Long cartItemId, BigDecimal quantity) {
        String sql = "UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE cart_id = ? AND cart_item_id = ?";
        jdbcTemplate.update(sql, quantity, cartId, cartItemId);
    }

    @Override
    public void removeCartItem(Long cartId, Long cartItemId) {
        String sql = "DELETE FROM cart_items WHERE cart_id = ? AND cart_item_id = ?";
        jdbcTemplate.update(sql, cartId, cartItemId);
    }

    @Override
    public void clearCart(Long cartId) {
        String sql = "DELETE FROM cart_items WHERE cart_id = ?";
        jdbcTemplate.update(sql, cartId);
    }

    @Override
    public int cleanupAbandonedCarts(int daysThreshold) {
        String sql = "UPDATE carts SET cart_status = 'ABANDONED' " +
                     "WHERE cart_status = 'ACTIVE' AND updated_at < NOW() - INTERVAL ? DAY";
        return jdbcTemplate.update(sql, daysThreshold);
    }
}

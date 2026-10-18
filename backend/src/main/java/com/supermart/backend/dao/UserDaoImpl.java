package com.supermart.backend.dao;

import com.supermart.backend.dto.AuthUser;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class UserDaoImpl implements UserDao {

    private final JdbcTemplate jdbcTemplate;

    public UserDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public boolean existsByEmail(String email) {
        String sql = "SELECT COUNT(*) FROM users WHERE email = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, email);
        return count != null && count > 0;
    }

    @Override
    public boolean existsByMobile(String mobile) {
        String sql = "SELECT COUNT(*) FROM users WHERE mobile = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, mobile);
        return count != null && count > 0;
    }

    @Override
    public Long createUser(String firstName, String lastName, String email, String mobile, String passwordHash) {
        String sql = "INSERT INTO users (first_name, last_name, email, mobile, password_hash, account_status) " +
                     "VALUES (?, ?, ?, ?, ?, 'ACTIVE')";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, firstName);
            ps.setString(2, lastName);
            ps.setString(3, email);
            ps.setString(4, mobile);
            ps.setString(5, passwordHash);
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to retrieve generated user ID from database.");
        }
        return key.longValue();
    }

    @Override
    public Optional<Long> findRoleIdByName(String roleName) {
        String sql = "SELECT role_id FROM roles WHERE role_name = ?";
        try {
            Long roleId = jdbcTemplate.queryForObject(sql, Long.class, roleName);
            return Optional.ofNullable(roleId);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    @Override
    public void assignUserRole(Long userId, Long roleId) {
        String sql = "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)";
        jdbcTemplate.update(sql, userId, roleId);
    }

    @Override
    public void createCustomerProfile(Long userId, boolean marketingOptIn) {
        String sql = "INSERT INTO customer_profiles (user_id, marketing_opt_in) VALUES (?, ?)";
        jdbcTemplate.update(sql, userId, marketingOptIn ? 1 : 0);
    }

    @Override
    public Optional<AuthUser> findByEmailOrMobile(String identifier) {
        String sql = "SELECT u.user_id, u.first_name, u.last_name, u.email, u.mobile, u.password_hash, u.account_status, r.role_name " +
                     "FROM users u " +
                     "LEFT JOIN user_roles ur ON u.user_id = ur.user_id " +
                     "LEFT JOIN roles r ON ur.role_id = r.role_id " +
                     "WHERE u.email = ? OR u.mobile = ? " +
                     "LIMIT 1";

        RowMapper<AuthUser> rowMapper = (rs, rowNum) -> new AuthUser(
                rs.getLong("user_id"),
                rs.getString("first_name"),
                rs.getString("last_name"),
                rs.getString("email"),
                rs.getString("mobile"),
                rs.getString("password_hash"),
                rs.getString("account_status"),
                rs.getString("role_name")
        );

        List<AuthUser> results = jdbcTemplate.query(sql, rowMapper, identifier, identifier);
        if (results.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(results.get(0));
    }

    @Override
    public Optional<AuthUser> findById(Long userId) {
        String sql = "SELECT u.user_id, u.first_name, u.last_name, u.email, u.mobile, u.password_hash, u.account_status, r.role_name " +
                     "FROM users u " +
                     "LEFT JOIN user_roles ur ON u.user_id = ur.user_id " +
                     "LEFT JOIN roles r ON ur.role_id = r.role_id " +
                     "WHERE u.user_id = ? " +
                     "LIMIT 1";

        RowMapper<AuthUser> rowMapper = (rs, rowNum) -> new AuthUser(
                rs.getLong("user_id"),
                rs.getString("first_name"),
                rs.getString("last_name"),
                rs.getString("email"),
                rs.getString("mobile"),
                rs.getString("password_hash"),
                rs.getString("account_status"),
                rs.getString("role_name")
        );

        List<AuthUser> results = jdbcTemplate.query(sql, rowMapper, userId);
        if (results.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(results.get(0));
    }

    @Override
    public void recordLoginAttempt(Long userId, String identifier, boolean wasSuccessful, String failureReason, String ipAddress) {
        String sql = "INSERT INTO login_attempts (user_id, attempted_identifier, was_successful, failure_reason, ip_address) " +
                     "VALUES (?, ?, ?, ?, ?)";
        try {
            jdbcTemplate.update(sql, userId, identifier, wasSuccessful ? 1 : 0, failureReason, ipAddress);
        } catch (Exception ignored) {
            // Non-critical logging must not interrupt auth response
        }
    }

    @Override
    public Long getOrCreateActiveCart(Long customerUserId) {
        String findCartSql = "SELECT cart_id FROM carts WHERE customer_id = ? AND cart_status = 'ACTIVE' LIMIT 1";
        List<Long> cartIds = jdbcTemplate.query(findCartSql, (rs, rowNum) -> rs.getLong("cart_id"), customerUserId);

        if (!cartIds.isEmpty()) {
            return cartIds.get(0);
        }

        String createCartSql = "INSERT INTO carts (customer_id, cart_status) VALUES (?, 'ACTIVE')";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(createCartSql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, customerUserId);
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to initialize active cart.");
        }
        return key.longValue();
    }

    @Override
    public void addCartItem(Long customerUserId, Long productId, int quantity) {
        Long cartId = getOrCreateActiveCart(customerUserId);

        // Verify product exists in database to respect foreign key constraint
        String checkProdSql = "SELECT COUNT(*) FROM products WHERE product_id = ?";
        Integer prodCount = jdbcTemplate.queryForObject(checkProdSql, Integer.class, productId);

        if (prodCount != null && prodCount > 0) {
            String checkItemSql = "SELECT cart_item_id FROM cart_items WHERE cart_id = ? AND product_id = ? LIMIT 1";
            List<Long> itemIds = jdbcTemplate.query(checkItemSql, (rs, rowNum) -> rs.getLong("cart_item_id"), cartId, productId);

            if (itemIds.isEmpty()) {
                String insertItemSql = "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)";
                jdbcTemplate.update(insertItemSql, cartId, productId, quantity);
            } else {
                String updateItemSql = "UPDATE cart_items SET quantity = quantity + ? WHERE cart_item_id = ?";
                jdbcTemplate.update(updateItemSql, quantity, itemIds.get(0));
            }
        }
    }

    @Override
    public List<com.supermart.backend.dto.UserManagementDto> findAllUsers() {
        String sql = "SELECT u.user_id, u.first_name, u.last_name, u.email, u.mobile, u.account_status, " +
                     "DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i') as created_at_str, " +
                     "COALESCE(r.role_name, 'CUSTOMER') AS role_name " +
                     "FROM users u " +
                     "LEFT JOIN user_roles ur ON u.user_id = ur.user_id " +
                     "LEFT JOIN roles r ON ur.role_id = r.role_id " +
                     "ORDER BY u.user_id DESC";

        return jdbcTemplate.query(sql, (rs, rowNum) -> new com.supermart.backend.dto.UserManagementDto(
                rs.getLong("user_id"),
                rs.getString("first_name"),
                rs.getString("last_name"),
                rs.getString("email"),
                rs.getString("mobile"),
                rs.getString("role_name"),
                rs.getString("account_status"),
                rs.getString("created_at_str")
        ));
    }

    @Override
    public Long createStaffUser(String firstName, String lastName, String email, String mobile, String passwordHash, String accountStatus) {
        String sql = "INSERT INTO users (first_name, last_name, email, mobile, password_hash, account_status) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, firstName);
            ps.setString(2, lastName);
            ps.setString(3, email);
            ps.setString(4, mobile);
            ps.setString(5, passwordHash);
            ps.setString(6, accountStatus != null ? accountStatus : "ACTIVE");
            return ps;
        }, keyHolder);

        Number key = keyHolder.getKey();
        if (key == null) {
            throw new IllegalStateException("Failed to retrieve generated user ID from database.");
        }
        return key.longValue();
    }

    @Override
    public void updateUserStatus(Long userId, String accountStatus) {
        String sql = "UPDATE users SET account_status = ? WHERE user_id = ?";
        jdbcTemplate.update(sql, accountStatus, userId);
    }

    @Override
    public void updateUserRole(Long userId, Long roleId) {
        String deleteSql = "DELETE FROM user_roles WHERE user_id = ?";
        jdbcTemplate.update(deleteSql, userId);

        String insertSql = "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)";
        jdbcTemplate.update(insertSql, userId, roleId);
    }

    @Override
    public com.supermart.backend.dto.AdminStatsDto getAdminStats() {
        long totalUsers = Optional.ofNullable(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Long.class)).orElse(0L);
        long totalProducts = Optional.ofNullable(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM v_active_product_catalog", Long.class)).orElse(0L);
        java.math.BigDecimal totalStockBd = Optional.ofNullable(jdbcTemplate.queryForObject("SELECT COALESCE(SUM(stock_quantity), 0) FROM inventory", java.math.BigDecimal.class)).orElse(java.math.BigDecimal.ZERO);
        double totalStock = totalStockBd.doubleValue();
        long lowStockCount = Optional.ofNullable(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM v_low_stock_report", Long.class)).orElse(0L);
        long alertCount = Optional.ofNullable(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM low_stock_alerts WHERE alert_status = 'OPEN'", Long.class)).orElse(0L);
        long movementCount = Optional.ofNullable(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM stock_movements", Long.class)).orElse(0L);

        return new com.supermart.backend.dto.AdminStatsDto(totalUsers, totalProducts, totalStock, lowStockCount, alertCount, movementCount);
    }
}

package com.supermart.backend.dao;

import com.supermart.backend.dto.CustomerAddressDto;
import com.supermart.backend.dto.OrderInvoiceDto;
import com.supermart.backend.dto.OrderItemDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public class OrderDaoImpl implements OrderDao {

    private final JdbcTemplate jdbcTemplate;

    public OrderDaoImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<OrderInvoiceDto> invoiceRowMapper = (rs, rowNum) -> {
        OrderInvoiceDto dto = new OrderInvoiceDto();
        dto.setOrderId(rs.getLong("order_id"));
        dto.setOrderNumber(rs.getString("order_number"));
        dto.setDeliveryName(rs.getString("delivery_name"));
        dto.setDeliveryCity(rs.getString("delivery_city"));
        dto.setSubtotal(rs.getBigDecimal("subtotal"));
        dto.setDiscountAmount(rs.getBigDecimal("discount_amount"));
        dto.setDeliveryFee(rs.getBigDecimal("delivery_fee"));
        dto.setTotalAmount(rs.getBigDecimal("total_amount"));
        dto.setOrderStatus(rs.getString("order_status"));
        dto.setPaymentMethod(rs.getString("payment_method"));
        if (rs.getTimestamp("placed_at") != null) {
            dto.setPlacedAt(rs.getTimestamp("placed_at").toLocalDateTime());
        }
        return dto;
    };

    private final RowMapper<OrderItemDto> itemRowMapper = (rs, rowNum) -> {
        OrderItemDto dto = new OrderItemDto();
        dto.setOrderItemId(rs.getLong("order_item_id"));
        dto.setOrderId(rs.getLong("order_id"));
        dto.setProductId(rs.getLong("product_id"));
        dto.setProductName(rs.getString("product_name_snapshot"));
        dto.setSellingUnit(rs.getString("selling_unit_snapshot"));
        dto.setQuantity(rs.getBigDecimal("quantity"));
        dto.setUnitPrice(rs.getBigDecimal("unit_price_snapshot"));
        dto.setLineTotal(rs.getBigDecimal("line_total"));
        return dto;
    };

    private final RowMapper<CustomerAddressDto> addressRowMapper = (rs, rowNum) -> {
        CustomerAddressDto dto = new CustomerAddressDto();
        dto.setAddressId(rs.getLong("address_id"));
        dto.setCustomerId(rs.getLong("customer_id"));
        dto.setAddressLabel(rs.getString("address_label"));
        dto.setAddressLine(rs.getString("address_line"));
        dto.setCity(rs.getString("city"));
        dto.setPostalCode(rs.getString("postal_code"));
        dto.setIsDefault(rs.getBoolean("is_default"));
        return dto;
    };

    @Override
    public OrderInvoiceDto placeOrder(Long customerId, Long cartId, Long addressId, String couponCode, String paymentMethod) {
        String callSql = "{CALL sp_place_order(?, ?, ?, ?, ?, ?, ?)}";

        Long[] resultIds = jdbcTemplate.execute(callSql, (CallableStatement cs) -> {
            cs.setLong(1, customerId);
            cs.setLong(2, cartId);
            cs.setLong(3, addressId);
            if (couponCode != null && !couponCode.trim().isEmpty()) {
                cs.setString(4, couponCode.trim());
            } else {
                cs.setNull(4, Types.VARCHAR);
            }
            cs.setString(5, paymentMethod != null ? paymentMethod : "CARD_TEST");
            cs.registerOutParameter(6, Types.BIGINT);
            cs.registerOutParameter(7, Types.VARCHAR);

            cs.execute();

            long createdOrderId = cs.getLong(6);
            String createdOrderNum = cs.getString(7);

            if (createdOrderId <= 0) {
                throw new IllegalStateException("Order placement failed inside sp_place_order transaction.");
            }
            return new Long[]{createdOrderId};
        });

        if (resultIds == null || resultIds[0] == null) {
            throw new IllegalStateException("Failed to retrieve generated order ID from sp_place_order.");
        }

        Long orderId = resultIds[0];
        Optional<OrderInvoiceDto> invoiceOpt = findOrderById(orderId);
        return invoiceOpt.orElseThrow(() -> new IllegalStateException("Order created but invoice not found in v_order_invoices."));
    }

    @Override
    public boolean testCheckoutConcurrencyLock(Long cartId) {
        String callSql = "{CALL sp_test_checkout_concurrency_lock(?, ?)}";
        return Boolean.TRUE.equals(jdbcTemplate.execute(callSql, (CallableStatement cs) -> {
            cs.setLong(1, cartId);
            cs.registerOutParameter(2, Types.BOOLEAN);
            cs.execute();
            return cs.getBoolean(2);
        }));
    }

    @Override
    public BigDecimal calculateCouponDiscount(String couponCode, BigDecimal subtotal) {
        String sql = "SELECT fn_calculate_coupon_discount(?, ?)";
        BigDecimal discount = jdbcTemplate.queryForObject(sql, BigDecimal.class, couponCode, subtotal);
        return discount != null ? discount : BigDecimal.ZERO;
    }

    @Override
    public List<OrderInvoiceDto> findOrdersByCustomerId(Long customerId) {
        String sql = "SELECT oi.* FROM v_order_invoices oi " +
                     "JOIN orders o ON oi.order_id = o.order_id " +
                     "WHERE o.customer_id = ? ORDER BY oi.placed_at DESC";
        List<OrderInvoiceDto> invoices = jdbcTemplate.query(sql, invoiceRowMapper, customerId);
        for (OrderInvoiceDto invoice : invoices) {
            invoice.setItems(findOrderItems(invoice.getOrderId()));
            enrichPaymentDetails(invoice);
        }
        return invoices;
    }

    @Override
    public List<OrderInvoiceDto> findAllOrders() {
        String sql = "SELECT * FROM v_order_invoices ORDER BY placed_at DESC";
        List<OrderInvoiceDto> invoices = jdbcTemplate.query(sql, invoiceRowMapper);
        for (OrderInvoiceDto invoice : invoices) {
            invoice.setItems(findOrderItems(invoice.getOrderId()));
            enrichPaymentDetails(invoice);
        }
        return invoices;
    }

    @Override
    public Optional<OrderInvoiceDto> findOrderById(Long orderId) {
        String sql = "SELECT * FROM v_order_invoices WHERE order_id = ?";
        List<OrderInvoiceDto> list = jdbcTemplate.query(sql, invoiceRowMapper, orderId);
        if (list.isEmpty()) {
            return Optional.empty();
        }
        OrderInvoiceDto invoice = list.get(0);
        invoice.setItems(findOrderItems(orderId));
        enrichPaymentDetails(invoice);
        return Optional.of(invoice);
    }

    private void enrichPaymentDetails(OrderInvoiceDto invoice) {
        try {
            String sql = "SELECT payment_status, transaction_reference FROM payments WHERE order_id = ? LIMIT 1";
            jdbcTemplate.query(sql, rs -> {
                invoice.setPaymentStatus(rs.getString("payment_status"));
                invoice.setTransactionReference(rs.getString("transaction_reference"));
            }, invoice.getOrderId());
        } catch (Exception ignored) {}
    }

    @Override
    public List<OrderItemDto> findOrderItems(Long orderId) {
        String sql = "SELECT * FROM order_items WHERE order_id = ?";
        return jdbcTemplate.query(sql, itemRowMapper, orderId);
    }

    @Override
    public boolean updateOrderStatus(Long orderId, String newOrderStatus, String newPaymentStatus) {
        String sql = "UPDATE orders SET order_status = ?, updated_at = NOW() WHERE order_id = ?";
        int updated = jdbcTemplate.update(sql, newOrderStatus, orderId);

        if (newPaymentStatus != null && !newPaymentStatus.trim().isEmpty()) {
            jdbcTemplate.update("UPDATE orders SET payment_status = ? WHERE order_id = ?", newPaymentStatus, orderId);
            jdbcTemplate.update("UPDATE payments SET payment_status = ? WHERE order_id = ?", newPaymentStatus, orderId);
        }
        return updated > 0;
    }

    @Override
    public Long findOrCreateCustomerAddress(Long customerId, String addressLine, String city, String postalCode) {
        String findSql = "SELECT address_id FROM customer_addresses WHERE customer_id = ? AND address_line = ? AND city = ? LIMIT 1";
        List<Long> ids = jdbcTemplate.query(findSql, (rs, rowNum) -> rs.getLong("address_id"), customerId, addressLine, city);
        if (!ids.isEmpty()) {
            return ids.get(0);
        }

        // Insert new address
        String insertSql = "INSERT INTO customer_addresses (customer_id, address_label, address_line, city, postal_code, is_default) " +
                           "VALUES (?, 'Delivery', ?, ?, ?, 1)";
        jdbcTemplate.update(insertSql, customerId, addressLine, city, postalCode != null ? postalCode : "00100");

        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    @Override
    public List<CustomerAddressDto> getCustomerAddresses(Long customerId) {
        String sql = "SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC";
        return jdbcTemplate.query(sql, addressRowMapper, customerId);
    }

    @Override
    public int cancelExpiredOrders() {
        String sql = "UPDATE orders SET order_status = 'CANCELLED' " +
                     "WHERE order_status = 'PENDING' AND placed_at < NOW() - INTERVAL 24 HOUR";
        return jdbcTemplate.update(sql);
    }
}

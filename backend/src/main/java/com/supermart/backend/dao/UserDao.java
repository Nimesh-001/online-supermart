package com.supermart.backend.dao;

import com.supermart.backend.dto.AuthUser;

import java.util.Optional;

public interface UserDao {

    boolean existsByEmail(String email);

    boolean existsByMobile(String mobile);

    Long createUser(String firstName, String lastName, String email, String mobile, String passwordHash);

    Optional<Long> findRoleIdByName(String roleName);

    void assignUserRole(Long userId, Long roleId);

    void createCustomerProfile(Long userId, boolean marketingOptIn);

    Optional<AuthUser> findByEmailOrMobile(String identifier);

    Optional<AuthUser> findById(Long userId);

    void recordLoginAttempt(Long userId, String identifier, boolean wasSuccessful, String failureReason, String ipAddress);

    Long getOrCreateActiveCart(Long customerUserId);

    void addCartItem(Long customerUserId, Long productId, int quantity);

    java.util.List<com.supermart.backend.dto.UserManagementDto> findAllUsers();

    Long createStaffUser(String firstName, String lastName, String email, String mobile, String passwordHash, String accountStatus);

    void updateUserStatus(Long userId, String accountStatus);

    void updateUserRole(Long userId, Long roleId);

    com.supermart.backend.dto.AdminStatsDto getAdminStats();
}

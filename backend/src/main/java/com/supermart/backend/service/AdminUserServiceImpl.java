package com.supermart.backend.service;

import com.supermart.backend.dao.UserDao;
import com.supermart.backend.dto.AdminStatsDto;
import com.supermart.backend.dto.CreateStaffUserRequest;
import com.supermart.backend.dto.UserManagementDto;
import com.supermart.backend.exception.BadRequestException;
import com.supermart.backend.exception.DuplicateResourceException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminUserServiceImpl implements AdminUserService {

    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;

    public AdminUserServiceImpl(UserDao userDao, PasswordEncoder passwordEncoder) {
        this.userDao = userDao;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<UserManagementDto> getAllUsers() {
        return userDao.findAllUsers();
    }

    @Override
    @Transactional
    public UserManagementDto createUser(CreateStaffUserRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String mobile = request.getMobile().trim();

        if (userDao.existsByEmail(email)) {
            throw new DuplicateResourceException("email", "A user with this email address already exists.");
        }

        if (userDao.existsByMobile(mobile)) {
            throw new DuplicateResourceException("mobile", "A user with this mobile number already exists.");
        }

        String roleName = request.getRoleName().trim().toUpperCase();
        Long roleId = userDao.findRoleIdByName(roleName)
                .orElseThrow(() -> new BadRequestException("Role not found: " + roleName));

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        String status = request.getAccountStatus() != null ? request.getAccountStatus().trim().toUpperCase() : "ACTIVE";

        Long userId = userDao.createStaffUser(
                request.getFirstName().trim(),
                request.getLastName().trim(),
                email,
                mobile,
                hashedPassword,
                status
        );

        userDao.assignUserRole(userId, roleId);

        if ("CUSTOMER".equals(roleName)) {
            userDao.createCustomerProfile(userId, false);
        }

        return new UserManagementDto(
                userId,
                request.getFirstName().trim(),
                request.getLastName().trim(),
                email,
                mobile,
                roleName,
                status,
                "Just now"
        );
    }

    @Override
    @Transactional
    public void updateUserStatus(Long userId, String status) {
        userDao.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found with ID: " + userId));

        String normalizedStatus = status.trim().toUpperCase();
        if (!"ACTIVE".equals(normalizedStatus) && !"INACTIVE".equals(normalizedStatus) && !"LOCKED".equals(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid status. Allowed values: ACTIVE, INACTIVE, LOCKED.");
        }

        userDao.updateUserStatus(userId, normalizedStatus);
    }

    @Override
    @Transactional
    public void updateUserRole(Long userId, String roleName) {
        userDao.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found with ID: " + userId));

        String normalizedRole = roleName.trim().toUpperCase();
        Long roleId = userDao.findRoleIdByName(normalizedRole)
                .orElseThrow(() -> new BadRequestException("Role not found: " + normalizedRole));

        userDao.updateUserRole(userId, roleId);
    }

    @Override
    public AdminStatsDto getAdminStats() {
        return userDao.getAdminStats();
    }

    @Override
    @Transactional
    public void seedDefaultStaffUsers() {
        // Seed Super Admin if not exists
        if (!userDao.existsByEmail("admin@supermart.com")) {
            Long superAdminRoleId = userDao.findRoleIdByName("SUPER_ADMIN").orElse(1L);
            Long adminUserId = userDao.createStaffUser(
                    "Super",
                    "Admin",
                    "admin@supermart.com",
                    "+94770000001",
                    passwordEncoder.encode("Admin@1234"),
                    "ACTIVE"
            );
            userDao.assignUserRole(adminUserId, superAdminRoleId);
        }

        // Seed Operational Manager if not exists
        if (!userDao.existsByEmail("manager@supermart.com")) {
            Long managerRoleId = userDao.findRoleIdByName("OPERATIONAL_MANAGER").orElse(2L);
            Long managerUserId = userDao.createStaffUser(
                    "Store",
                    "Manager",
                    "manager@supermart.com",
                    "+94770000002",
                    passwordEncoder.encode("Manager@1234"),
                    "ACTIVE"
            );
            userDao.assignUserRole(managerUserId, managerRoleId);
        }
    }
}

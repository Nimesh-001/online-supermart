package com.supermart.backend.service;

import com.supermart.backend.dto.AdminStatsDto;
import com.supermart.backend.dto.CreateStaffUserRequest;
import com.supermart.backend.dto.UserManagementDto;

import java.util.List;

public interface AdminUserService {

    List<UserManagementDto> getAllUsers();

    UserManagementDto createUser(CreateStaffUserRequest request);

    void updateUserStatus(Long userId, String status);

    void updateUserRole(Long userId, String roleName);

    AdminStatsDto getAdminStats();

    void seedDefaultStaffUsers();
}

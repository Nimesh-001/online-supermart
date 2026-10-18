package com.supermart.backend.config;

import com.supermart.backend.service.AdminUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class AdminDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminDataInitializer.class);
    private final AdminUserService adminUserService;

    public AdminDataInitializer(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @Override
    public void run(String... args) {
        try {
            adminUserService.seedDefaultStaffUsers();
            log.info("SuperMart Online default administrative staff accounts initialized.");
        } catch (Exception e) {
            log.warn("Notice during admin user initialization: {}", e.getMessage());
        }
    }
}

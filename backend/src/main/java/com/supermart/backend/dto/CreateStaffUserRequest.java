package com.supermart.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateStaffUserRequest {

    @NotBlank(message = "First name is mandatory.")
    @Size(max = 100, message = "First name must not exceed 100 characters.")
    private String firstName;

    @NotBlank(message = "Last name is mandatory.")
    @Size(max = 100, message = "Last name must not exceed 100 characters.")
    private String lastName;

    @NotBlank(message = "Email address is mandatory.")
    @Email(message = "Email must be a valid format.")
    @Size(max = 150, message = "Email must not exceed 150 characters.")
    private String email;

    @NotBlank(message = "Mobile number is mandatory.")
    @Pattern(regexp = "^(\\+94|0)[0-9]{9,10}$", message = "Mobile must be a valid Sri Lankan phone number (+947XXXXXXXX or 07XXXXXXXX).")
    private String mobile;

    @NotBlank(message = "Password is mandatory.")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters.")
    private String password;

    @NotBlank(message = "Role name is mandatory.")
    private String roleName;

    private String accountStatus;

    public CreateStaffUserRequest() {
    }

    public CreateStaffUserRequest(String firstName, String lastName, String email, String mobile, String password, String roleName, String accountStatus) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.mobile = mobile;
        this.password = password;
        this.roleName = roleName;
        this.accountStatus = accountStatus;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }
}

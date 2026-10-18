package com.supermart.backend.service;

import com.supermart.backend.dao.UserDao;
import com.supermart.backend.dto.AuthUser;
import com.supermart.backend.dto.CustomerRegistrationRequest;
import com.supermart.backend.dto.CustomerRegistrationResponse;
import com.supermart.backend.dto.LoginRequest;
import com.supermart.backend.dto.LoginResponse;
import com.supermart.backend.exception.AccountDisabledException;
import com.supermart.backend.exception.BadCredentialsException;
import com.supermart.backend.exception.BadRequestException;
import com.supermart.backend.exception.DuplicateResourceException;
import com.supermart.backend.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CustomerAuthServiceImpl implements CustomerAuthService {

    private static final String DEFAULT_PUBLIC_ROLE = "CUSTOMER";
    public static final String SESSION_USER_ID = "AUTH_USER_ID";
    public static final String SESSION_USER_ROLE = "AUTH_USER_ROLE";
    public static final String SESSION_USER_EMAIL = "AUTH_USER_EMAIL";
    public static final String SESSION_USER_NAME = "AUTH_USER_NAME";

    private final UserDao userDao;
    private final PasswordEncoder passwordEncoder;

    public CustomerAuthServiceImpl(UserDao userDao, PasswordEncoder passwordEncoder) {
        this.userDao = userDao;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomerRegistrationResponse registerCustomer(CustomerRegistrationRequest request) {
        // 1. Validate password confirmation
        if (request.getPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Password and confirm password do not match");
        }

        // 2. Clean/normalize inputs
        String firstName = request.getFirstName().trim();
        String lastName = request.getLastName().trim();
        String email = request.getEmail().trim().toLowerCase();
        String mobile = request.getMobile().trim();

        // 3. Verify email uniqueness
        if (userDao.existsByEmail(email)) {
            throw new DuplicateResourceException("email", "An account with email '" + email + "' is already registered.");
        }

        // 4. Verify mobile uniqueness
        if (userDao.existsByMobile(mobile)) {
            throw new DuplicateResourceException("mobile", "An account with mobile number '" + mobile + "' is already registered.");
        }

        // 5. Look up default CUSTOMER role (ensures public registration cannot assign administrative roles)
        Long customerRoleId = userDao.findRoleIdByName(DEFAULT_PUBLIC_ROLE)
                .orElseThrow(() -> new IllegalStateException("System role '" + DEFAULT_PUBLIC_ROLE + "' is not configured in the database."));

        // 6. Hash password securely with BCrypt
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 7. Atomic transaction writes
        // Step 7a: Create user record in 'users' table
        Long userId = userDao.createUser(firstName, lastName, email, mobile, hashedPassword);

        // Step 7b: Assign only CUSTOMER role in 'user_roles' table
        userDao.assignUserRole(userId, customerRoleId);

        // Step 7c: Create associated profile in 'customer_profiles' table
        userDao.createCustomerProfile(userId, request.getMarketingOptIn());

        // 8. Return response strictly excluding password or hash
        return new CustomerRegistrationResponse(
                userId,
                firstName,
                lastName,
                email,
                mobile,
                DEFAULT_PUBLIC_ROLE,
                "ACTIVE"
        );
    }

    @Override
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String identifier = request.getIdentifier().trim();
        String rawPassword = request.getPassword();
        String clientIp = httpRequest != null ? httpRequest.getRemoteAddr() : null;

        // 1. Look up user by email OR mobile
        Optional<AuthUser> userOpt = userDao.findByEmailOrMobile(identifier);

        // 2. Verify existence and BCrypt password match (generic error to avoid account enumeration)
        if (userOpt.isEmpty() || !passwordEncoder.matches(rawPassword, userOpt.get().getPasswordHash())) {
            Long userId = userOpt.map(AuthUser::getUserId).orElse(null);
            userDao.recordLoginAttempt(userId, identifier, false, "INVALID_CREDENTIALS", clientIp);
            throw new BadCredentialsException("Invalid email/mobile number or password.");
        }

        AuthUser user = userOpt.get();

        // 3. Check account status
        if (!"ACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
            userDao.recordLoginAttempt(user.getUserId(), identifier, false, "ACCOUNT_INACTIVE", clientIp);
            throw new AccountDisabledException("Your account is currently " + user.getAccountStatus().toLowerCase() + ". Please contact customer support.");
        }

        // 4. Record successful login attempt
        userDao.recordLoginAttempt(user.getUserId(), identifier, true, null, clientIp);

        // 5. Establish real HttpOnly servlet session
        if (httpRequest != null) {
            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(SESSION_USER_ID, user.getUserId());
            session.setAttribute(SESSION_USER_ROLE, user.getRoleName());
            session.setAttribute(SESSION_USER_EMAIL, user.getEmail());
            session.setAttribute(SESSION_USER_NAME, user.getFirstName() + " " + user.getLastName());
        }

        // 6. Return safe profile without sensitive hash
        return new LoginResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getMobile(),
                user.getRoleName() != null ? user.getRoleName() : DEFAULT_PUBLIC_ROLE,
                user.getAccountStatus()
        );
    }

    @Override
    public LoginResponse getAuthenticatedUser(HttpServletRequest httpRequest) {
        if (httpRequest == null) {
            throw new UnauthorizedException("Authentication required.");
        }

        HttpSession session = httpRequest.getSession(false);
        if (session == null || session.getAttribute(SESSION_USER_ID) == null) {
            throw new UnauthorizedException("No active authenticated session. Please sign in.");
        }

        Long userId = (Long) session.getAttribute(SESSION_USER_ID);
        AuthUser user = userDao.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user no longer exists."));

        if (!"ACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
            session.invalidate();
            throw new AccountDisabledException("Your account is no longer active.");
        }

        return new LoginResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getMobile(),
                user.getRoleName() != null ? user.getRoleName() : DEFAULT_PUBLIC_ROLE,
                user.getAccountStatus()
        );
    }

    @Override
    public void logout(HttpServletRequest httpRequest) {
        if (httpRequest != null) {
            HttpSession session = httpRequest.getSession(false);
            if (session != null) {
                session.invalidate();
            }
        }
    }
}

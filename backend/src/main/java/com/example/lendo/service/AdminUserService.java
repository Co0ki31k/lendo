package com.example.lendo.service;

import com.example.lendo.dto.AdminUserListResponse;
import com.example.lendo.dto.AdminUserResponse;
import com.example.lendo.dto.PageMetadata;
import com.example.lendo.model.User;
import com.example.lendo.repository.RoleRepository;
import com.example.lendo.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUserService {
    private static final Set<String> MANAGEABLE_ROLES = Set.of("CLIENT", "ADMIN");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AccountAnonymizationService accountAnonymizationService;

    @Transactional
    public AdminUserListResponse getUsers(
            int page,
            int size,
            String search,
            String role,
            String sortBy,
            String sortDir
    ) {
        Specification<User> specification = buildUserSpecification(search, role);
        Pageable pageable = PageRequest.of(
                normalizePage(page),
                normalizeSize(size),
                buildSort(sortBy, sortDir, "createdAt", "email", "firstName", "lastName")
        );

        Page<User> userPage = userRepository.findAll(specification, pageable);

        long total = userRepository.count(specification);
        long userCount = userRepository.count(specification.and(hasRole("CLIENT")));
        long adminCount = userRepository.count(specification.and(hasRole("ADMIN")));

        return new AdminUserListResponse(
                userPage.getContent().stream()
                        .map(AdminUserResponse::from)
                        .toList(),
                toMetadata(userPage),
                new AdminUserListResponse.Summary(total, userCount, adminCount)
        );
    }

    @Transactional
    public AdminUserResponse updateUserRole(UUID userId, String rawRole, UUID currentAdminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Uzytkownik nie istnieje"));

        if (!MANAGEABLE_ROLES.contains(user.getRoleName())) {
            throw new RuntimeException("Rola managera jest zarzadzana tylko przez formularz partnera");
        }

        String normalizedRole = normalizeManageableRole(rawRole);

        if (currentAdminId.equals(userId) && "CLIENT".equals(normalizedRole)) {
            throw new RuntimeException("Nie mozesz odebrac sobie roli admina");
        }

        user.setRole(roleRepository.findByName(normalizedRole)
                .orElseThrow(() -> new IllegalStateException("Brakuje roli " + normalizedRole)));

        return AdminUserResponse.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(UUID userId, UUID currentAdminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Uzytkownik nie istnieje"));

        if (!MANAGEABLE_ROLES.contains(user.getRoleName())) {
            throw new RuntimeException("Konta managera nie usuwamy z poziomu tej zakladki");
        }

        if (currentAdminId.equals(userId)) {
            throw new RuntimeException("Nie mozesz usunac wlasnego konta");
        }

        if (!user.isActive()) {
            throw new RuntimeException("To konto zostalo juz usuniete");
        }

        accountAnonymizationService.anonymizeUser(user);
        userRepository.save(user);
    }

    private Specification<User> buildUserSpecification(String search, String role) {
        Specification<User> specification = manageableRolesSpecification();

        if (StringUtils.hasText(role) && !"all".equalsIgnoreCase(role.trim())) {
            specification = specification.and(hasRole(normalizeManageableRole(role)));
        }

        if (StringUtils.hasText(search)) {
            String normalizedSearch = "%" + search.trim().toLowerCase() + "%";
            specification = specification.and((root, query, criteriaBuilder) -> criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), normalizedSearch),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), normalizedSearch),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("lastName")), normalizedSearch),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("phoneNumber")), normalizedSearch)
            ));
        }

        return specification;
    }

    private Specification<User> manageableRolesSpecification() {
        return (root, query, criteriaBuilder) -> root.join("role").get("name").in(MANAGEABLE_ROLES);
    }

    private Specification<User> hasRole(String roleName) {
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.join("role").get("name"), roleName);
    }

    private String normalizeManageableRole(String rawRole) {
        if (!StringUtils.hasText(rawRole)) {
            throw new RuntimeException("Rola jest wymagana");
        }

        String normalizedRole = rawRole.trim().toUpperCase();
        if (!MANAGEABLE_ROLES.contains(normalizedRole)) {
            throw new RuntimeException("Mozna ustawic tylko role CLIENT albo ADMIN");
        }

        return normalizedRole;
    }

    private Sort buildSort(String sortBy, String sortDir, String... allowedFields) {
        String normalizedSortBy = StringUtils.hasText(sortBy) ? sortBy.trim() : "createdAt";
        boolean allowed = List.of(allowedFields).contains(normalizedSortBy);

        if (!allowed) {
            normalizedSortBy = "createdAt";
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, normalizedSortBy);
    }

    private PageMetadata toMetadata(Page<?> page) {
        return new PageMetadata(
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.hasNext(),
                page.hasPrevious()
        );
    }

    private int normalizePage(int page) {
        return Math.max(page, 0);
    }

    private int normalizeSize(int size) {
        return Math.max(1, Math.min(size, 50));
    }
}

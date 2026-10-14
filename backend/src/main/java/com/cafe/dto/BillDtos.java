package com.cafe.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Request/response shapes for the /bill and /dashboard APIs. */
public final class BillDtos {

    private BillDtos() { }

    public record OrderItemRequest(@NotNull Long productId, @NotNull @Min(1) @Max(999) Integer quantity) { }

    public record GenerateBillRequest(
            @NotBlank @Size(max = 100) String name,
            @Email @Size(max = 150) String email,
            @Size(max = 20) String contactNumber,
            @NotBlank @Size(max = 30) String paymentMethod,
            @NotEmpty @Valid List<OrderItemRequest> items) { }

    /** A line item snapshot stored with the bill (prices frozen at order time). */
    public record BillLine(Long productId, String name, String category,
                           int quantity, BigDecimal price, BigDecimal total) { }

    public record BillResponse(Long id, String uuid, String name, String email, String contactNumber,
                               String paymentMethod, BigDecimal total, List<BillLine> items,
                               String createdBy, LocalDateTime createdAt) { }

    public record GenerateBillResponse(String uuid, BigDecimal total) { }

    public record DashboardResponse(long category, long product, long bill, long user, long pendingOnlineOrders) { }
}

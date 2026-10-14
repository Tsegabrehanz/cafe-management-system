package com.cafe.dto;

import com.cafe.dto.BillDtos.BillLine;
import com.cafe.dto.BillDtos.OrderItemRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Request/response shapes for public online ordering and the staff order queue. */
public final class OnlineOrderDtos {

    private OnlineOrderDtos() { }

    // ---------------------------------------------------------------- public menu

    public record MenuProduct(Long id, String name, String description, BigDecimal price) { }

    public record MenuCategory(Long id, String name, List<MenuProduct> products) { }

    // ---------------------------------------------------------------- placing an order

    public record PlaceOrderRequest(
            @NotBlank @Size(max = 100) String customerName,
            @NotBlank @Pattern(regexp = "^[0-9+\\- ]{6,20}$", message = "must be a valid phone number")
            String contactNumber,
            @Email @Size(max = 150) String email,
            @NotBlank @Pattern(regexp = "PICKUP|DELIVERY") String orderType,
            @Size(max = 300) String address,
            @Size(max = 300) String note,
            @NotEmpty @Size(max = 30) @Valid List<OrderItemRequest> items) { }

    public record PlaceOrderResponse(String code, BigDecimal total, String status) { }

    /** What a customer sees when tracking — no contact details. */
    public record TrackOrderResponse(String code, String customerName, String orderType, String status,
                                     BigDecimal total, List<BillLine> items,
                                     LocalDateTime createdAt, LocalDateTime updatedAt) { }

    // ---------------------------------------------------------------- staff queue

    public record OnlineOrderResponse(Long id, String code, String customerName, String contactNumber,
                                      String email, String orderType, String address, String note,
                                      BigDecimal total, List<BillLine> items, String status,
                                      List<String> nextStatuses, String billUuid, String handledBy,
                                      LocalDateTime createdAt, LocalDateTime updatedAt) { }

    public record UpdateOrderStatusRequest(
            @NotNull Long id,
            @NotBlank @Pattern(regexp = "ACCEPTED|READY|COMPLETED|CANCELLED") String status,
            @Size(max = 30) String paymentMethod) { }
}

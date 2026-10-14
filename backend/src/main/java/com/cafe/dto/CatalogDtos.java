package com.cafe.dto;

import com.cafe.entity.Category;
import com.cafe.entity.Product;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/** Request/response shapes for the /category and /product APIs. */
public final class CatalogDtos {

    private CatalogDtos() { }

    public record CategoryRequest(Long id, @NotBlank @Size(max = 100) String name) { }

    public record CategoryResponse(Long id, String name) {
        public static CategoryResponse of(Category c) {
            return new CategoryResponse(c.getId(), c.getName());
        }
    }

    public record ProductRequest(
            Long id,
            @NotBlank @Size(max = 100) String name,
            @NotNull Long categoryId,
            @Size(max = 500) String description,
            @NotNull @DecimalMin(value = "0.00") @Digits(integer = 8, fraction = 2) BigDecimal price) { }

    public record ProductStatusRequest(@NotNull Long id, @NotNull Boolean status) { }

    public record ProductResponse(Long id, String name, String description, BigDecimal price,
                                  boolean status, Long categoryId, String categoryName) {
        public static ProductResponse of(Product p) {
            return new ProductResponse(p.getId(), p.getName(), p.getDescription(), p.getPrice(),
                    p.isStatus(), p.getCategory().getId(), p.getCategory().getName());
        }
    }
}

package com.cafe.controller;

import com.cafe.dto.CatalogDtos.ProductRequest;
import com.cafe.dto.CatalogDtos.ProductResponse;
import com.cafe.dto.CatalogDtos.ProductStatusRequest;
import com.cafe.dto.MessageResponse;
import com.cafe.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/product")
public class ProductController {

    private final CatalogService catalogService;

    public ProductController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @PostMapping("/add")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse add(@Valid @RequestBody ProductRequest req) {
        return catalogService.addProduct(req);
    }

    @GetMapping("/get")
    public List<ProductResponse> getAll() {
        return catalogService.getProducts();
    }

    @PostMapping("/update")
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse update(@Valid @RequestBody ProductRequest req) {
        return catalogService.updateProduct(req);
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MessageResponse delete(@PathVariable Long id) {
        catalogService.deleteProduct(id);
        return new MessageResponse("Product deleted successfully.");
    }

    @PostMapping("/updateStatus")
    @PreAuthorize("hasRole('ADMIN')")
    public MessageResponse updateStatus(@Valid @RequestBody ProductStatusRequest req) {
        catalogService.updateProductStatus(req);
        return new MessageResponse("Product status updated successfully.");
    }

    /** Active products in a category — used by the order page. */
    @GetMapping("/getByCategory/{id}")
    public List<ProductResponse> getByCategory(@PathVariable Long id) {
        return catalogService.getActiveProductsByCategory(id);
    }

    @GetMapping("/getById/{id}")
    public ProductResponse getById(@PathVariable Long id) {
        return catalogService.getProduct(id);
    }
}

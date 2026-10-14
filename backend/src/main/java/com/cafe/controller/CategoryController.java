package com.cafe.controller;

import com.cafe.dto.CatalogDtos.CategoryRequest;
import com.cafe.dto.CatalogDtos.CategoryResponse;
import com.cafe.dto.MessageResponse;
import com.cafe.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/category")
public class CategoryController {

    private final CatalogService catalogService;

    public CategoryController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @PostMapping("/add")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse add(@Valid @RequestBody CategoryRequest req) {
        return catalogService.addCategory(req);
    }

    @GetMapping("/get")
    public List<CategoryResponse> get(@RequestParam(required = false, defaultValue = "false") boolean filterValue) {
        return catalogService.getCategories(filterValue);
    }

    @PostMapping("/update")
    @PreAuthorize("hasRole('ADMIN')")
    public CategoryResponse update(@Valid @RequestBody CategoryRequest req) {
        return catalogService.updateCategory(req);
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MessageResponse delete(@PathVariable Long id) {
        catalogService.deleteCategory(id);
        return new MessageResponse("Category deleted successfully.");
    }
}

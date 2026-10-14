package com.cafe.service;

import com.cafe.dto.CatalogDtos.*;
import com.cafe.entity.Category;
import com.cafe.entity.Product;
import com.cafe.exception.ApiException;
import com.cafe.repository.CategoryRepository;
import com.cafe.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Categories and products. */
@Service
public class CatalogService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CatalogService(CategoryRepository categoryRepository, ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    // ---------------------------------------------------------------- categories

    @Transactional
    public CategoryResponse addCategory(CategoryRequest req) {
        String name = req.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw ApiException.conflict("Category already exists.");
        }
        return CategoryResponse.of(categoryRepository.save(new Category(name)));
    }

    /** filterValue=true returns only categories with orderable products (used by the order page). */
    public List<CategoryResponse> getCategories(boolean onlyWithActiveProducts) {
        List<Category> list = onlyWithActiveProducts
                ? categoryRepository.findAllWithActiveProducts()
                : categoryRepository.findAllByOrderByNameAsc();
        return list.stream().map(CategoryResponse::of).toList();
    }

    @Transactional
    public CategoryResponse updateCategory(CategoryRequest req) {
        if (req.id() == null) throw ApiException.badRequest("Category id is required.");
        Category category = categoryRepository.findById(req.id())
                .orElseThrow(() -> ApiException.notFound("Category id does not exist."));
        String name = req.name().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, req.id())) {
            throw ApiException.conflict("Category already exists.");
        }
        category.setName(name);
        return CategoryResponse.of(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) throw ApiException.notFound("Category id does not exist.");
        if (productRepository.countByCategoryId(id) > 0) {
            throw ApiException.conflict("Category still has products. Move or delete them first.");
        }
        categoryRepository.deleteById(id);
    }

    // ---------------------------------------------------------------- products

    @Transactional
    public ProductResponse addProduct(ProductRequest req) {
        Product p = new Product();
        apply(p, req);
        p.setStatus(true);
        return ProductResponse.of(productRepository.save(p));
    }

    public List<ProductResponse> getProducts() {
        return productRepository.findAllByOrderByNameAsc().stream().map(ProductResponse::of).toList();
    }

    @Transactional
    public ProductResponse updateProduct(ProductRequest req) {
        if (req.id() == null) throw ApiException.badRequest("Product id is required.");
        Product p = findProduct(req.id());
        apply(p, req);
        return ProductResponse.of(productRepository.save(p));
    }

    @Transactional
    public void deleteProduct(Long id) {
        productRepository.delete(findProduct(id));
    }

    @Transactional
    public void updateProductStatus(ProductStatusRequest req) {
        Product p = findProduct(req.id());
        p.setStatus(req.status());
        productRepository.save(p);
    }

    public List<ProductResponse> getActiveProductsByCategory(Long categoryId) {
        return productRepository.findAllByCategoryIdAndStatusTrueOrderByNameAsc(categoryId).stream()
                .map(ProductResponse::of).toList();
    }

    public ProductResponse getProduct(Long id) {
        return ProductResponse.of(findProduct(id));
    }

    Product findProduct(Long id) {
        return productRepository.findById(id).orElseThrow(() -> ApiException.notFound("Product id does not exist."));
    }

    private void apply(Product p, ProductRequest req) {
        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> ApiException.badRequest("Category id does not exist."));
        p.setName(req.name().trim());
        p.setCategory(category);
        p.setDescription(req.description() == null ? null : req.description().trim());
        p.setPrice(req.price());
    }
}

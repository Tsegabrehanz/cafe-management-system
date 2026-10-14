package com.cafe.repository;

import com.cafe.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findAllByOrderByNameAsc();

    List<Product> findAllByCategoryIdAndStatusTrueOrderByNameAsc(Long categoryId);

    long countByCategoryId(Long categoryId);
}

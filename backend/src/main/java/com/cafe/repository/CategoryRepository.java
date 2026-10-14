package com.cafe.repository;

import com.cafe.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    List<Category> findAllByOrderByNameAsc();

    /** Categories that have at least one product available for ordering. */
    @Query("select distinct c from Category c where c.id in " +
           "(select p.category.id from Product p where p.status = true) order by c.name")
    List<Category> findAllWithActiveProducts();
}

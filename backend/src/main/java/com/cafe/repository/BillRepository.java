package com.cafe.repository;

import com.cafe.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, Long> {

    List<Bill> findAllByOrderByIdDesc();

    List<Bill> findAllByCreatedByIgnoreCaseOrderByIdDesc(String createdBy);

    Optional<Bill> findByUuid(String uuid);
}

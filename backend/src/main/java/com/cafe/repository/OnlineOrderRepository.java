package com.cafe.repository;

import com.cafe.entity.OnlineOrder;
import com.cafe.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OnlineOrderRepository extends JpaRepository<OnlineOrder, Long> {

    Optional<OnlineOrder> findByCode(String code);

    boolean existsByCode(String code);

    List<OnlineOrder> findAllByOrderByIdDesc();

    List<OnlineOrder> findAllByStatusOrderByIdDesc(OrderStatus status);

    long countByStatus(OrderStatus status);
}

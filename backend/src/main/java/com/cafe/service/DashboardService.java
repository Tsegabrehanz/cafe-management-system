package com.cafe.service;

import com.cafe.dto.BillDtos.DashboardResponse;
import com.cafe.entity.Role;
import com.cafe.entity.OrderStatus;
import com.cafe.repository.BillRepository;
import com.cafe.repository.OnlineOrderRepository;
import com.cafe.repository.CategoryRepository;
import com.cafe.repository.ProductRepository;
import com.cafe.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final BillRepository billRepository;
    private final UserRepository userRepository;
    private final OnlineOrderRepository onlineOrderRepository;

    public DashboardService(CategoryRepository categoryRepository, ProductRepository productRepository,
                            BillRepository billRepository, UserRepository userRepository,
                            OnlineOrderRepository onlineOrderRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.billRepository = billRepository;
        this.userRepository = userRepository;
        this.onlineOrderRepository = onlineOrderRepository;
    }

    public DashboardResponse details() {
        return new DashboardResponse(
                categoryRepository.count(),
                productRepository.count(),
                billRepository.count(),
                userRepository.findAllByRoleOrderByNameAsc(Role.USER).size(),
                onlineOrderRepository.countByStatus(OrderStatus.PENDING));
    }
}

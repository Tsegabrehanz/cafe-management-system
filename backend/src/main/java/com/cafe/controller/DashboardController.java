package com.cafe.controller;

import com.cafe.dto.BillDtos.DashboardResponse;
import com.cafe.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/details")
    public DashboardResponse details() {
        return dashboardService.details();
    }
}

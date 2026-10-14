package com.cafe.controller;

import com.cafe.dto.OnlineOrderDtos.OnlineOrderResponse;
import com.cafe.dto.OnlineOrderDtos.UpdateOrderStatusRequest;
import com.cafe.service.OnlineOrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Staff view of incoming online orders. Any logged-in staff member can work the queue. */
@RestController
@RequestMapping("/onlineOrder")
public class OnlineOrderController {

    private final OnlineOrderService orderService;

    public OnlineOrderController(OnlineOrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/get")
    public List<OnlineOrderResponse> list(@RequestParam(required = false) String status) {
        return orderService.list(status);
    }

    @GetMapping("/pendingCount")
    public Map<String, Long> pendingCount() {
        return Map.of("count", orderService.countPending());
    }

    @PostMapping("/updateStatus")
    public OnlineOrderResponse updateStatus(@Valid @RequestBody UpdateOrderStatusRequest req) {
        return orderService.updateStatus(req);
    }
}

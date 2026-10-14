package com.cafe.controller;

import com.cafe.dto.OnlineOrderDtos.*;
import com.cafe.service.OnlineOrderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Open endpoints for customers — no login required. */
@RestController
@RequestMapping("/public")
public class PublicOrderController {

    private final OnlineOrderService orderService;

    public PublicOrderController(OnlineOrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/menu")
    public List<MenuCategory> menu() {
        return orderService.menu();
    }

    @PostMapping("/order")
    @ResponseStatus(HttpStatus.CREATED)
    public PlaceOrderResponse place(@Valid @RequestBody PlaceOrderRequest req, HttpServletRequest http) {
        return orderService.place(req, http.getRemoteAddr());
    }

    @GetMapping("/order/{code}")
    public TrackOrderResponse track(@PathVariable String code) {
        return orderService.track(code);
    }
}

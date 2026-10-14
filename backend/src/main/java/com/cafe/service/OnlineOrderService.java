package com.cafe.service;

import com.cafe.dto.OnlineOrderDtos.*;
import com.cafe.entity.Category;
import com.cafe.entity.OnlineOrder;
import com.cafe.entity.OnlineOrder.OrderType;
import com.cafe.entity.OrderStatus;
import com.cafe.exception.ApiException;
import com.cafe.repository.CategoryRepository;
import com.cafe.repository.OnlineOrderRepository;
import com.cafe.repository.ProductRepository;
import com.cafe.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Locale;

@Service
public class OnlineOrderService {

    /** No 0/O, 1/I/L — easy to read out over the phone. */
    private static final String CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;
    private static final int MAX_QTY_PER_PRODUCT = 50;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OnlineOrderRepository orderRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final BillService billService;
    private final OrderRateLimiter rateLimiter;

    public OnlineOrderService(OnlineOrderRepository orderRepository, CategoryRepository categoryRepository,
                              ProductRepository productRepository, BillService billService,
                              OrderRateLimiter rateLimiter) {
        this.orderRepository = orderRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.billService = billService;
        this.rateLimiter = rateLimiter;
    }

    // ================================================================ public

    /** Categories that have orderable products, each with those products. */
    public List<MenuCategory> menu() {
        return categoryRepository.findAllWithActiveProducts().stream()
                .map(this::toMenuCategory)
                .toList();
    }

    private MenuCategory toMenuCategory(Category c) {
        List<MenuProduct> products = productRepository.findAllByCategoryIdAndStatusTrueOrderByNameAsc(c.getId())
                .stream()
                .map(p -> new MenuProduct(p.getId(), p.getName(), p.getDescription(), p.getPrice()))
                .toList();
        return new MenuCategory(c.getId(), c.getName(), products);
    }

    @Transactional
    public PlaceOrderResponse place(PlaceOrderRequest req, String clientIp) {
        if (!rateLimiter.tryAcquire(clientIp)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Too many orders from your connection. Please wait a few minutes or call us.");
        }
        OrderType type = OrderType.valueOf(req.orderType());
        String address = blankToNull(req.address());
        if (type == OrderType.DELIVERY && address == null) {
            throw ApiException.badRequest("Please enter a delivery address.");
        }

        BillService.PricedOrder priced = billService.price(req.items(), MAX_QTY_PER_PRODUCT);

        OnlineOrder o = new OnlineOrder();
        o.setCode(newCode());
        o.setCustomerName(req.customerName().trim());
        o.setContactNumber(req.contactNumber().trim());
        o.setEmail(blankToNull(req.email()));
        o.setOrderType(type);
        o.setAddress(type == OrderType.DELIVERY ? address : null);
        o.setNote(blankToNull(req.note()));
        o.setProductDetails(billService.toJson(priced.lines()));
        o.setTotal(priced.total());
        o.setStatus(OrderStatus.PENDING);
        orderRepository.save(o);
        return new PlaceOrderResponse(o.getCode(), o.getTotal(), o.getStatus().name());
    }

    public TrackOrderResponse track(String code) {
        OnlineOrder o = orderRepository.findByCode(code.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> ApiException.notFound("No order found with that code."));
        return new TrackOrderResponse(o.getCode(), firstName(o.getCustomerName()), o.getOrderType().name(),
                o.getStatus().name(), o.getTotal(), billService.fromJson(o.getProductDetails()),
                o.getCreatedAt(), o.getUpdatedAt());
    }

    // ================================================================ staff

    /** All orders, or only those with the given status. */
    public List<OnlineOrderResponse> list(String status) {
        List<OnlineOrder> orders = (status == null || status.isBlank() || status.equalsIgnoreCase("ALL"))
                ? orderRepository.findAllByOrderByIdDesc()
                : orderRepository.findAllByStatusOrderByIdDesc(parseStatus(status));
        return orders.stream().map(this::toResponse).toList();
    }

    public long countPending() {
        return orderRepository.countByStatus(OrderStatus.PENDING);
    }

    /**
     * Moves an order to its next status. Completing an order creates a bill for it,
     * so it shows up in View Bill and the dashboard like any counter sale.
     */
    @Transactional
    public OnlineOrderResponse updateStatus(UpdateOrderStatusRequest req) {
        OnlineOrder o = orderRepository.findById(req.id())
                .orElseThrow(() -> ApiException.notFound("Order not found."));
        OrderStatus target = parseStatus(req.status());
        if (!o.getStatus().next().contains(target)) {
            throw ApiException.conflict("Order " + o.getCode() + " is " + o.getStatus().name().toLowerCase()
                    + " and can't be changed to " + target.name().toLowerCase() + ".");
        }
        if (target == OrderStatus.COMPLETED) {
            String payment = blankToNull(req.paymentMethod());
            String uuid = billService.createBill(o.getCustomerName(), o.getEmail(), o.getContactNumber(),
                    payment == null ? "Cash" : payment,
                    billService.fromJson(o.getProductDetails()), o.getTotal(), CurrentUser.email());
            o.setBillUuid(uuid);
        }
        o.setStatus(target);
        o.setHandledBy(CurrentUser.email());
        orderRepository.save(o);
        return toResponse(o);
    }

    // ================================================================ helpers

    private OnlineOrderResponse toResponse(OnlineOrder o) {
        return new OnlineOrderResponse(o.getId(), o.getCode(), o.getCustomerName(), o.getContactNumber(),
                o.getEmail(), o.getOrderType().name(), o.getAddress(), o.getNote(), o.getTotal(),
                billService.fromJson(o.getProductDetails()), o.getStatus().name(),
                o.getStatus().next().stream().map(Enum::name).sorted().toList(),
                o.getBillUuid(), o.getHandledBy(), o.getCreatedAt(), o.getUpdatedAt());
    }

    private static OrderStatus parseStatus(String s) {
        try {
            return OrderStatus.valueOf(s.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Unknown status: " + s);
        }
    }

    private String newCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            String code = sb.toString();
            if (!orderRepository.existsByCode(code)) return code;
        }
        throw new IllegalStateException("Could not generate a unique order code");
    }

    private static String firstName(String name) {
        String n = name.trim();
        int space = n.indexOf(' ');
        return space > 0 ? n.substring(0, space) : n;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}

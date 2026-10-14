package com.cafe.service;

import com.cafe.dto.BillDtos.*;
import com.cafe.entity.Bill;
import com.cafe.entity.Product;
import com.cafe.exception.ApiException;
import com.cafe.repository.BillRepository;
import com.cafe.security.CurrentUser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class BillService {

    private static final DateTimeFormatter UUID_TS = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final BillRepository billRepository;
    private final CatalogService catalogService;
    private final PdfService pdfService;
    private final ObjectMapper objectMapper;

    public BillService(BillRepository billRepository, CatalogService catalogService,
                       PdfService pdfService, ObjectMapper objectMapper) {
        this.billRepository = billRepository;
        this.catalogService = catalogService;
        this.pdfService = pdfService;
        this.objectMapper = objectMapper;
    }

    /**
     * Creates a bill. Prices are taken from the database, not from the client, so a
     * tampered request can't change what the customer is charged. Duplicate product
     * lines are merged.
     */
    @Transactional
    public GenerateBillResponse generate(GenerateBillRequest req) {
        PricedOrder priced = price(req.items(), 999);
        String uuid = createBill(req.name(), req.email(), req.contactNumber(), req.paymentMethod(),
                priced.lines(), priced.total(), CurrentUser.email());
        return new GenerateBillResponse(uuid, priced.total());
    }

    /** Order lines priced from the database, plus their total. */
    public record PricedOrder(List<BillLine> lines, BigDecimal total) { }

    /**
     * Looks up every product, rejects unavailable ones and merges duplicate lines.
     * Prices always come from the database, never from the client.
     */
    public PricedOrder price(List<OrderItemRequest> items, int maxQuantityPerProduct) {
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (OrderItemRequest item : items) {
            quantities.merge(item.productId(), item.quantity(), Integer::sum);
        }

        List<BillLine> lines = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> e : quantities.entrySet()) {
            Product p = catalogService.findProduct(e.getKey());
            if (!p.isStatus()) {
                throw ApiException.badRequest("Product '" + p.getName() + "' is not available.");
            }
            if (e.getValue() > maxQuantityPerProduct) {
                throw ApiException.badRequest("At most " + maxQuantityPerProduct + " of '" + p.getName() + "' per order.");
            }
            BigDecimal lineTotal = p.getPrice().multiply(BigDecimal.valueOf(e.getValue()));
            lines.add(new BillLine(p.getId(), p.getName(), p.getCategory().getName(),
                    e.getValue(), p.getPrice(), lineTotal));
            total = total.add(lineTotal);
        }
        return new PricedOrder(lines, total);
    }

    /** Saves a bill and returns its bill number. */
    @Transactional
    public String createBill(String name, String email, String contactNumber, String paymentMethod,
                             List<BillLine> lines, BigDecimal total, String createdBy) {
        Bill bill = new Bill();
        bill.setName(name.trim());
        bill.setEmail(blankToNull(email));
        bill.setContactNumber(blankToNull(contactNumber));
        bill.setPaymentMethod(paymentMethod.trim());
        bill.setTotal(total);
        bill.setProductDetails(toJson(lines));
        bill.setCreatedBy(createdBy);
        bill.setCreatedAt(java.time.LocalDateTime.now());
        bill.setUuid("BILL-" + UUID_TS.format(bill.getCreatedAt()) + "-"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        billRepository.save(bill);
        return bill.getUuid();
    }

    public String toJson(List<BillLine> lines) {
        try {
            return objectMapper.writeValueAsString(lines);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    public List<BillLine> fromJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<>() { });
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Corrupt order data", e);
        }
    }

    /** Admins see every bill; staff see the bills they created. */
    public List<BillResponse> getBills() {
        List<Bill> bills = CurrentUser.isAdmin()
                ? billRepository.findAllByOrderByIdDesc()
                : billRepository.findAllByCreatedByIgnoreCaseOrderByIdDesc(CurrentUser.email());
        return bills.stream().map(this::toResponse).toList();
    }

    public byte[] getPdf(String uuid) {
        Bill bill = findAccessible(uuid);
        return pdfService.render(toResponse(bill));
    }

    @Transactional
    public void delete(Long id) {
        Bill bill = billRepository.findById(id).orElseThrow(() -> ApiException.notFound("Bill id does not exist."));
        billRepository.delete(bill);
    }

    private Bill findAccessible(String uuid) {
        Bill bill = billRepository.findByUuid(uuid).orElseThrow(() -> ApiException.notFound("Bill not found."));
        if (!CurrentUser.isAdmin() && !bill.getCreatedBy().equalsIgnoreCase(CurrentUser.email())) {
            throw ApiException.notFound("Bill not found.");   // don't reveal other users' bills exist
        }
        return bill;
    }

    private BillResponse toResponse(Bill b) {
        return new BillResponse(b.getId(), b.getUuid(), b.getName(), b.getEmail(), b.getContactNumber(),
                b.getPaymentMethod(), b.getTotal(), fromJson(b.getProductDetails()),
                b.getCreatedBy(), b.getCreatedAt());
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}

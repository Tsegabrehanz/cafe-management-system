package com.cafe.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** An order placed by a customer through the public online ordering page. */
@Entity
@Table(name = "online_order", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
public class OnlineOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Short tracking code the customer uses to check the order status. */
    @Column(nullable = false, length = 12)
    private String code;

    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Column(name = "contact_number", nullable = false, length = 20)
    private String contactNumber;

    @Column(length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false, length = 10)
    private OrderType orderType;

    /** Delivery address — only for DELIVERY orders. */
    @Column(length = 300)
    private String address;

    @Column(length = 300)
    private String note;

    /** JSON snapshot of the order lines (same format as bill.product_details). */
    @Column(name = "product_details", columnDefinition = "TEXT", nullable = false)
    private String productDetails;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private OrderStatus status;

    /** Bill created when the order was completed. */
    @Column(name = "bill_uuid", length = 60)
    private String billUuid;

    /** Email of the staff member who last changed the status. */
    @Column(name = "handled_by", length = 150)
    private String handledBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum OrderType { PICKUP, DELIVERY }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public OrderType getOrderType() { return orderType; }
    public void setOrderType(OrderType orderType) { this.orderType = orderType; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getProductDetails() { return productDetails; }
    public void setProductDetails(String productDetails) { this.productDetails = productDetails; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public String getBillUuid() { return billUuid; }
    public void setBillUuid(String billUuid) { this.billUuid = billUuid; }
    public String getHandledBy() { return handledBy; }
    public void setHandledBy(String handledBy) { this.handledBy = handledBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

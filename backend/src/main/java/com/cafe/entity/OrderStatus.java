package com.cafe.entity;

import java.util.Set;

/** Lifecycle of an online order. */
public enum OrderStatus {
    PENDING, ACCEPTED, READY, COMPLETED, CANCELLED;

    /** Allowed next steps from this status. */
    public Set<OrderStatus> next() {
        return switch (this) {
            case PENDING -> Set.of(ACCEPTED, CANCELLED);
            case ACCEPTED -> Set.of(READY, CANCELLED);
            case READY -> Set.of(COMPLETED, CANCELLED);
            case COMPLETED, CANCELLED -> Set.of();
        };
    }
}

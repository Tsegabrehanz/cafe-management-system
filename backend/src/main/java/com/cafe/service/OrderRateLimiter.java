package com.cafe.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Small in-memory limit on public orders per client IP, so the open order form
 * can't be used to flood the kitchen with fake orders.
 */
@Component
public class OrderRateLimiter {

    private final int maxOrders;
    private final Duration window;
    private final ConcurrentHashMap<String, Deque<Instant>> hits = new ConcurrentHashMap<>();

    public OrderRateLimiter(@Value("${app.online-order.max-per-window:5}") int maxOrders,
                            @Value("${app.online-order.window-minutes:10}") long windowMinutes) {
        this.maxOrders = maxOrders;
        this.window = Duration.ofMinutes(windowMinutes);
    }

    /** Records an attempt and returns false if the client is over the limit. */
    public boolean tryAcquire(String clientKey) {
        Instant now = Instant.now();
        Instant cutoff = now.minus(window);
        Deque<Instant> q = hits.computeIfAbsent(clientKey, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && q.peekFirst().isBefore(cutoff)) q.pollFirst();
            if (q.size() >= maxOrders) return false;
            q.addLast(now);
        }
        if (hits.size() > 10_000) {                       // keep memory bounded
            hits.entrySet().removeIf(e -> {
                synchronized (e.getValue()) {
                    return e.getValue().isEmpty() || e.getValue().peekLast().isBefore(cutoff);
                }
            });
        }
        return true;
    }
}

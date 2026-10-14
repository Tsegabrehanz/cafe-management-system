package com.cafe.config;

import com.cafe.entity.Category;
import com.cafe.entity.Product;
import com.cafe.repository.CategoryRepository;
import com.cafe.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Fills an empty database with a sample menu so the app is usable right away.
 * Runs only when there are no categories yet; turn off with app.seed-sample-data=false.
 */
@Component
@Order(2)
public class SampleDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SampleDataSeeder.class);

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final boolean enabled;

    public SampleDataSeeder(CategoryRepository categoryRepository, ProductRepository productRepository,
                            @Value("${app.seed-sample-data:true}") boolean enabled) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.enabled = enabled;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled || categoryRepository.count() > 0) return;

        Category coffee = categoryRepository.save(new Category("Coffee"));
        Category tea = categoryRepository.save(new Category("Tea"));
        Category cold = categoryRepository.save(new Category("Cold Drinks"));
        Category bakery = categoryRepository.save(new Category("Bakery"));
        Category food = categoryRepository.save(new Category("Sandwiches"));

        product(coffee, "Espresso", "Single shot of espresso", "2.20");
        product(coffee, "Cappuccino", "Espresso with steamed milk foam", "3.40");
        product(coffee, "Latte Macchiato", "Layered milk and espresso", "3.80");
        product(coffee, "Ethiopian Buna", "Traditional Ethiopian coffee", "3.00");
        product(tea, "Black Tea", "Classic black tea", "2.50");
        product(tea, "Green Tea", "Japanese sencha", "2.70");
        product(tea, "Fresh Mint Tea", "Fresh mint leaves with honey", "3.00");
        product(cold, "Iced Coffee", "Cold brew over ice", "3.90");
        product(cold, "Fresh Orange Juice", "Freshly squeezed, 0.3 l", "3.80");
        product(cold, "Mineral Water", "Sparkling, 0.5 l", "2.20");
        product(bakery, "Butter Croissant", "Baked fresh every morning", "2.10");
        product(bakery, "Apple Strudel", "With vanilla sauce", "3.90");
        product(bakery, "Chocolate Muffin", "Double chocolate", "2.80");
        product(food, "Cheese Sandwich", "Gouda, tomato and lettuce", "4.50");
        product(food, "Chicken Panini", "Grilled chicken, pesto, mozzarella", "6.20");

        log.info("Sample menu created: {} categories, {} products.",
                categoryRepository.count(), productRepository.count());
    }

    private void product(Category category, String name, String description, String price) {
        Product p = new Product();
        p.setCategory(category);
        p.setName(name);
        p.setDescription(description);
        p.setPrice(new BigDecimal(price));
        p.setStatus(true);
        productRepository.save(p);
    }
}

package com.cafe.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * When the Angular app is served by Spring Boot, a page reload on an app route
 * (e.g. /cafe/dashboard or /online/track/ABC) must return index.html so Angular's
 * router can take over. API paths are never matched here.
 */
@Controller
public class SpaForwardController {

    @GetMapping({"/cafe", "/cafe/**", "/online", "/online/**"})
    public String forwardToApp() {
        return "forward:/index.html";
    }
}

package com.cafe.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.util.List;

/**
 * Sends notification emails. When app.mail.enabled=false (the default for local dev),
 * messages are written to the log instead so the app works without SMTP credentials.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final boolean enabled;
    private final String from;
    private final String appUrl;

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
                        @Value("${app.mail.enabled:false}") boolean enabled,
                        @Value("${app.mail.from:no-reply@cafe.local}") String from,
                        @Value("${app.frontend-url:http://localhost:4200}") String appUrl) {
        this.mailSender = mailSender;
        this.enabled = enabled;
        this.from = from;
        this.appUrl = appUrl;
    }

    @Async
    public void sendToAdmins(List<String> adminEmails, String subject, String text) {
        for (String to : adminEmails) {
            send(to, subject, "<p>" + HtmlUtils.htmlEscape(text) + "</p>");
        }
    }

    @Async
    public void sendTemporaryPassword(String to, String tempPassword) {
        String html = """
                <p><b>Your login details for Cafe Management System</b></p>
                <p><b>Email:</b> %s<br><b>Temporary password:</b> %s</p>
                <p>Please log in and change this password right away.</p>
                <p><a href="%s">Click here to log in</a></p>
                """.formatted(HtmlUtils.htmlEscape(to), HtmlUtils.htmlEscape(tempPassword), appUrl);
        send(to, "Credentials by Cafe Management System", html);
    }

    private void send(String to, String subject, String html) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (!enabled || sender == null) {
            log.info("[mail disabled] To: {} | Subject: {}\n{}", to, subject, html);
            return;
        }
        try {
            MimeMessage msg = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            sender.send(msg);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}

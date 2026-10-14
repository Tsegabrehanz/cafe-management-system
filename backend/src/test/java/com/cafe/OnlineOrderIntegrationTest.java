package com.cafe;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Customer places an order without logging in; staff accepts, readies and completes it. */
@SpringBootTest(properties = {
        "app.online-order.max-per-window=3",
        "spring.datasource.url=jdbc:h2:mem:onlineorders;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class OnlineOrderIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;

    private JsonNode json(MvcResult r) throws Exception {
        return om.readTree(r.getResponse().getContentAsString());
    }

    private String adminToken() throws Exception {
        MvcResult r = mvc.perform(post("/user/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@cafe.com\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk()).andReturn();
        return "Bearer " + json(r).get("token").asText();
    }

    private String order(long productId, int qty, String type, String address) {
        return "{\"customerName\":\"Hana Tesfaye\",\"contactNumber\":\"0170 1234567\",\"email\":\"hana@example.com\","
                + "\"orderType\":\"" + type + "\"" + (address == null ? "" : ",\"address\":\"" + address + "\"")
                + ",\"note\":\"Extra hot\",\"items\":[{\"productId\":" + productId + ",\"quantity\":" + qty + "}]}";
    }

    @Test
    void customerOrdersAndStaffCompletes() throws Exception {
        String admin = adminToken();

        // admin sets up a small menu
        long cat = json(mvc.perform(post("/category/add").header("Authorization", admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Online Coffee\"}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        long latte = json(mvc.perform(post("/product/add").header("Authorization", admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Online Latte\",\"categoryId\":" + cat + ",\"price\":3.50}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();

        // public menu needs no login
        mvc.perform(get("/public/menu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name=='Online Coffee')].products[0].name").value("Online Latte"));

        // delivery without address is rejected
        mvc.perform(post("/public/order").contentType(MediaType.APPLICATION_JSON).content(order(latte, 2, "DELIVERY", null)))
                .andExpect(status().isBadRequest());

        // customer places a pickup order; total is computed on the server
        JsonNode placed = json(mvc.perform(post("/public/order").contentType(MediaType.APPLICATION_JSON)
                        .content(order(latte, 2, "PICKUP", null)))
                .andExpect(status().isCreated()).andReturn());
        String code = placed.get("code").asText();
        assertThat(code).hasSize(8);
        assertThat(placed.get("total").decimalValue()).isEqualByComparingTo("7.00");

        // tracking works without login and hides contact details
        mvc.perform(get("/public/order/" + code.toLowerCase()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.customerName").value("Hana"))
                .andExpect(jsonPath("$.contactNumber").doesNotExist());
        mvc.perform(get("/public/order/NOPE1234")).andExpect(status().isNotFound());

        // staff endpoints still need a login
        mvc.perform(get("/onlineOrder/get")).andExpect(status().isUnauthorized());

        JsonNode orders = json(mvc.perform(get("/onlineOrder/get?status=PENDING").header("Authorization", admin))
                .andExpect(status().isOk()).andReturn());
        long id = orders.get(0).get("id").asLong();
        mvc.perform(get("/dashboard/details").header("Authorization", admin))
                .andExpect(jsonPath("$.pendingOnlineOrders").value(1));

        // illegal jump PENDING -> COMPLETED is refused
        mvc.perform(post("/onlineOrder/updateStatus").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":" + id + ",\"status\":\"COMPLETED\"}")).andExpect(status().isConflict());

        for (String s : new String[]{"ACCEPTED", "READY"}) {
            mvc.perform(post("/onlineOrder/updateStatus").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"id\":" + id + ",\"status\":\"" + s + "\"}"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.status").value(s));
        }
        JsonNode done = json(mvc.perform(post("/onlineOrder/updateStatus").header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"id\":" + id + ",\"status\":\"COMPLETED\",\"paymentMethod\":\"Card\"}"))
                .andExpect(status().isOk()).andReturn());
        assertThat(done.get("billUuid").asText()).startsWith("BILL-");

        // completing created a normal bill
        mvc.perform(get("/bill/getPdf/" + done.get("billUuid").asText()).header("Authorization", admin))
                .andExpect(status().isOk());
        mvc.perform(get("/public/order/" + code)).andExpect(jsonPath("$.status").value("COMPLETED"));

        // rate limit is 3 per window here: the rejected delivery attempt and the first order used 2
        mvc.perform(post("/public/order").contentType(MediaType.APPLICATION_JSON).content(order(latte, 1, "PICKUP", null)))
                .andExpect(status().isCreated());
        mvc.perform(post("/public/order").contentType(MediaType.APPLICATION_JSON).content(order(latte, 1, "PICKUP", null)))
                .andExpect(status().isTooManyRequests());
    }
}

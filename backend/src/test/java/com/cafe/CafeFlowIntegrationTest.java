package com.cafe;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** End-to-end walk through the main flows against an in-memory database. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CafeFlowIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;

    private JsonNode json(MvcResult r) throws Exception {
        return om.readTree(r.getResponse().getContentAsString());
    }

    private String login(String email, String pw) throws Exception {
        MvcResult r = mvc.perform(post("/user/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + pw + "\"}"))
                .andExpect(status().isOk()).andReturn();
        return "Bearer " + json(r).get("token").asText();
    }

    @Test
    void fullFlow() throws Exception {
        // anonymous access is rejected
        mvc.perform(get("/product/get")).andExpect(status().isUnauthorized());

        // signup -> cannot log in until approved
        mvc.perform(post("/user/signup").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Staff\",\"contactNumber\":\"0151234567\",\"email\":\"staff@cafe.com\",\"password\":\"secret1\"}"))
                .andExpect(status().isCreated());
        mvc.perform(post("/user/signup").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Staff\",\"contactNumber\":\"0151234567\",\"email\":\"STAFF@cafe.com\",\"password\":\"secret1\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/user/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"staff@cafe.com\",\"password\":\"secret1\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Wait for admin approval."));

        // admin approves
        String admin = login("admin@cafe.com", "admin123");
        JsonNode users = json(mvc.perform(get("/user/get").header("Authorization", admin))
                .andExpect(status().isOk()).andReturn());
        long staffId = users.get(0).get("id").asLong();
        mvc.perform(post("/user/update").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":" + staffId + ",\"status\":true}")).andExpect(status().isOk());

        String staff = login("staff@cafe.com", "secret1");

        // staff cannot use admin endpoints
        mvc.perform(get("/user/get").header("Authorization", staff)).andExpect(status().isForbidden());
        mvc.perform(post("/category/add").header("Authorization", staff).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Hack\"}")).andExpect(status().isForbidden());

        // admin builds the menu
        long catId = json(mvc.perform(post("/category/add").header("Authorization", admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Coffee\"}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        long espresso = json(mvc.perform(post("/product/add").header("Authorization", admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Espresso\",\"categoryId\":" + catId + ",\"description\":\"Short\",\"price\":2.50}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        long latte = json(mvc.perform(post("/product/add").header("Authorization", admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Latte\",\"categoryId\":" + catId + ",\"price\":3.90}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();

        mvc.perform(get("/category/get?filterValue=true").header("Authorization", staff))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("Coffee"));
        mvc.perform(get("/product/getByCategory/" + catId).header("Authorization", staff))
                .andExpect(jsonPath("$.length()").value(2));

        // disable latte -> no longer orderable
        mvc.perform(post("/product/updateStatus").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":" + latte + ",\"status\":false}")).andExpect(status().isOk());
        mvc.perform(post("/bill/generateReport").header("Authorization", staff).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Ana\",\"paymentMethod\":\"Cash\",\"items\":[{\"productId\":" + latte + ",\"quantity\":1}]}"))
                .andExpect(status().isBadRequest());

        // staff creates a bill; total is computed server-side
        JsonNode bill = json(mvc.perform(post("/bill/generateReport").header("Authorization", staff)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Ana\",\"email\":\"ana@x.de\",\"contactNumber\":\"0170000\",\"paymentMethod\":\"Card\","
                        + "\"items\":[{\"productId\":" + espresso + ",\"quantity\":2},{\"productId\":" + espresso + ",\"quantity\":1}]}"))
                .andExpect(status().isCreated()).andReturn());
        assertThat(bill.get("total").decimalValue()).isEqualByComparingTo("7.50");
        String uuid = bill.get("uuid").asText();

        MvcResult pdf = mvc.perform(get("/bill/getPdf/" + uuid).header("Authorization", staff))
                .andExpect(status().isOk()).andExpect(content().contentType(MediaType.APPLICATION_PDF)).andReturn();
        assertThat(new String(pdf.getResponse().getContentAsByteArray(), 0, 5)).isEqualTo("%PDF-");

        mvc.perform(get("/bill/getBills").header("Authorization", staff))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].items[0].quantity").value(3));

        // dashboard
        mvc.perform(get("/dashboard/details").header("Authorization", staff))
                .andExpect(jsonPath("$.category").value(1))
                .andExpect(jsonPath("$.product").value(2))
                .andExpect(jsonPath("$.bill").value(1));

        // change password
        mvc.perform(post("/user/changePassword").header("Authorization", staff).contentType(MediaType.APPLICATION_JSON)
                .content("{\"oldPassword\":\"wrong\",\"newPassword\":\"newpass1\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/user/changePassword").header("Authorization", staff).contentType(MediaType.APPLICATION_JSON)
                .content("{\"oldPassword\":\"secret1\",\"newPassword\":\"newpass1\"}")).andExpect(status().isOk());
        login("staff@cafe.com", "newpass1");

        // forgot password gives the same answer for unknown emails
        mvc.perform(post("/user/forgotPassword").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"nobody@cafe.com\"}")).andExpect(status().isOk());

        // disabling a user revokes access immediately
        mvc.perform(post("/user/update").header("Authorization", admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"id\":" + staffId + ",\"status\":false}")).andExpect(status().isOk());
        mvc.perform(get("/user/checkToken").header("Authorization", staff)).andExpect(status().isUnauthorized());

        // category with products cannot be deleted
        mvc.perform(delete("/category/delete/" + catId).header("Authorization", admin)).andExpect(status().isConflict());
    }
}

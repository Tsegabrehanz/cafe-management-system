package com.cafe.controller;

import com.cafe.dto.BillDtos.BillResponse;
import com.cafe.dto.BillDtos.GenerateBillRequest;
import com.cafe.dto.BillDtos.GenerateBillResponse;
import com.cafe.dto.MessageResponse;
import com.cafe.service.BillService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bill")
public class BillController {

    private final BillService billService;

    public BillController(BillService billService) {
        this.billService = billService;
    }

    @PostMapping("/generateReport")
    @ResponseStatus(HttpStatus.CREATED)
    public GenerateBillResponse generate(@Valid @RequestBody GenerateBillRequest req) {
        return billService.generate(req);
    }

    @GetMapping("/getBills")
    public List<BillResponse> getBills() {
        return billService.getBills();
    }

    @GetMapping(value = "/getPdf/{uuid}", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> getPdf(@PathVariable String uuid) {
        byte[] pdf = billService.getPdf(uuid);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(uuid + ".pdf").build().toString())
                .body(pdf);
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public MessageResponse delete(@PathVariable Long id) {
        billService.delete(id);
        return new MessageResponse("Bill deleted successfully.");
    }
}

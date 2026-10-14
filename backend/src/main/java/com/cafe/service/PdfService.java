package com.cafe.service;

import com.cafe.dto.BillDtos.BillLine;
import com.cafe.dto.BillDtos.BillResponse;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;

/** Renders a bill as a PDF, on demand — nothing is written to disk. */
@Service
public class PdfService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");
    private static final Color ACCENT = new Color(0x5D, 0x40, 0x37);   // coffee brown

    private final String cafeName;
    private final String currency;

    public PdfService(@Value("${app.cafe-name:Cafe Management System}") String cafeName,
                      @Value("${app.currency:€}") String currency) {
        this.cafeName = cafeName;
        this.currency = currency;
    }

    public byte[] render(BillResponse bill) {
        try {
            return doRender(bill);
        } catch (Exception e) {
            throw new IllegalStateException("Could not generate bill PDF", e);
        }
    }

    private byte[] doRender(BillResponse bill) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
        PdfWriter.getInstance(doc, out);
        doc.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, ACCENT);
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font textFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE);

        Paragraph title = new Paragraph(cafeName, titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(16);
        doc.add(title);

        doc.add(line(labelFont, textFont, "Bill no: ", bill.uuid()));
        doc.add(line(labelFont, textFont, "Date: ", bill.createdAt() == null ? "" : DATE.format(bill.createdAt())));
        doc.add(line(labelFont, textFont, "Customer: ", bill.name()));
        if (bill.email() != null) doc.add(line(labelFont, textFont, "Email: ", bill.email()));
        if (bill.contactNumber() != null) doc.add(line(labelFont, textFont, "Contact: ", bill.contactNumber()));
        Paragraph pay = line(labelFont, textFont, "Payment method: ", bill.paymentMethod());
        pay.setSpacingAfter(14);
        doc.add(pay);

        PdfPTable table = new PdfPTable(new float[]{4f, 3f, 1.4f, 2f, 2.2f});
        table.setWidthPercentage(100);
        for (String h : new String[]{"Name", "Category", "Qty", "Price", "Sub total"}) {
            PdfPCell c = new PdfPCell(new Phrase(h, headFont));
            c.setBackgroundColor(ACCENT);
            c.setPadding(6);
            c.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(c);
        }
        for (BillLine l : bill.items()) {
            table.addCell(cell(l.name(), textFont, Element.ALIGN_LEFT));
            table.addCell(cell(l.category(), textFont, Element.ALIGN_LEFT));
            table.addCell(cell(String.valueOf(l.quantity()), textFont, Element.ALIGN_CENTER));
            table.addCell(cell(money(l.price()), textFont, Element.ALIGN_RIGHT));
            table.addCell(cell(money(l.total()), textFont, Element.ALIGN_RIGHT));
        }
        doc.add(table);

        Paragraph total = new Paragraph("Total: " + money(bill.total()),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, ACCENT));
        total.setAlignment(Element.ALIGN_RIGHT);
        total.setSpacingBefore(12);
        doc.add(total);

        Paragraph thanks = new Paragraph("Thank you for visiting. Please visit again!", textFont);
        thanks.setAlignment(Element.ALIGN_CENTER);
        thanks.setSpacingBefore(30);
        doc.add(thanks);

        doc.close();
        return out.toByteArray();
    }

    private String money(BigDecimal v) {
        return new DecimalFormat("#,##0.00").format(v) + " " + currency;
    }

    private static Paragraph line(Font label, Font text, String l, String v) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(l, label));
        p.add(new Chunk(v == null ? "" : v, text));
        return p;
    }

    private static PdfPCell cell(String s, Font f, int align) {
        PdfPCell c = new PdfPCell(new Phrase(s == null ? "" : s, f));
        c.setPadding(5);
        c.setHorizontalAlignment(align);
        return c;
    }
}

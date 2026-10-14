package com.cafe.dto;

/** Simple {"message": "..."} body, used for success and error responses alike. */
public record MessageResponse(String message) { }

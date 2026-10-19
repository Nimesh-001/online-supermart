package com.supermart.backend.dto;

public class ReserveCartResponse {

    private String reserveStatus;
    private boolean success;
    private String message;

    public ReserveCartResponse() {
    }

    public ReserveCartResponse(String reserveStatus, boolean success, String message) {
        this.reserveStatus = reserveStatus;
        this.success = success;
        this.message = message;
    }

    public String getReserveStatus() {
        return reserveStatus;
    }

    public void setReserveStatus(String reserveStatus) {
        this.reserveStatus = reserveStatus;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

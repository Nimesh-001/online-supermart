package com.supermart.backend.dto;

public class CustomerAddressDto {
    private Long addressId;
    private Long customerId;
    private String addressLabel;
    private String addressLine;
    private String city;
    private String postalCode;
    private Boolean isDefault;

    public CustomerAddressDto() {}

    public Long getAddressId() { return addressId; }
    public void setAddressId(Long addressId) { this.addressId = addressId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getAddressLabel() { return addressLabel; }
    public void setAddressLabel(String addressLabel) { this.addressLabel = addressLabel; }

    public String getAddressLine() { return addressLine; }
    public void setAddressLine(String addressLine) { this.addressLine = addressLine; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
}

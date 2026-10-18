package com.supermart.backend.dto;

public class BrandDto {

    private Long brandId;
    private String brandName;
    private int productCount;

    public BrandDto() {
    }

    public BrandDto(Long brandId, String brandName, int productCount) {
        this.brandId = brandId;
        this.brandName = brandName;
        this.productCount = productCount;
    }

    public Long getBrandId() {
        return brandId;
    }

    public void setBrandId(Long brandId) {
        this.brandId = brandId;
    }

    public String getBrandName() {
        return brandName;
    }

    public void setBrandName(String brandName) {
        this.brandName = brandName;
    }

    public int getProductCount() {
        return productCount;
    }

    public void setProductCount(int productCount) {
        this.productCount = productCount;
    }
}

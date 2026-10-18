package com.supermart.backend.dto;

public class CategoryDto {

    private Long categoryId;
    private String categoryName;
    private String description;
    private int productCount;
    private String icon;

    public CategoryDto() {
    }

    public CategoryDto(Long categoryId, String categoryName, String description, int productCount, String icon) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.description = description;
        this.productCount = productCount;
        this.icon = icon;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getProductCount() {
        return productCount;
    }

    public void setProductCount(int productCount) {
        this.productCount = productCount;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }
}

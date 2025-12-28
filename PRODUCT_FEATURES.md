# Product Video & Nutrition Information Features

## Overview
Added two new features to product detail pages:
1. **Preparation Video** - Shows how to prepare/cook the product
2. **Nutrition Information** - Comprehensive nutrition facts and allergen information

## Frontend Implementation

### Components Created

#### 1. ProductVideo Component (`components/ProductVideo.tsx`)
- Supports YouTube URLs (auto-detects and embeds)
- Supports direct video URLs
- Beautiful thumbnail with play button overlay
- Full-screen modal video player
- Responsive design with dark mode support

#### 2. NutritionInfo Component (`components/NutritionInfo.tsx`)
- Expandable/collapsible nutrition facts table
- FDA-style nutrition label design
- Daily value percentages
- Vitamins and minerals display
- Allergen warnings with visual indicators
- Serving size information

### Type Updates

Updated `Product` interface in `types/index.ts`:
```typescript
export interface Product {
  // ... existing fields
  videoUrl?: string; // YouTube URL or direct video URL
  nutritionInfo?: NutritionInfo;
}

export interface NutritionInfo {
  calories?: number;
  protein?: number; // grams
  carbohydrates?: number; // grams
  fat?: number; // grams
  saturatedFat?: number; // grams
  transFat?: number; // grams
  cholesterol?: number; // mg
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
  servingSize?: string; // e.g., "1 cup (240ml)"
  servingsPerContainer?: number;
  vitamins?: { [key: string]: number }; // e.g., { "Vitamin C": 50 }
  minerals?: { [key: string]: number }; // e.g., { "Iron": 15 }
  allergens?: string[]; // e.g., ["Gluten", "Dairy", "Nuts"]
}
```

## Backend Requirements

### Database Schema Updates

Add to `Products` table:
```sql
ALTER TABLE Products
ADD VideoUrl NVARCHAR(500) NULL,
ADD NutritionInfo NVARCHAR(MAX) NULL; -- JSON string
```

### DTO Updates

Update `ProductDto` in backend:
```csharp
public class ProductDto
{
    // ... existing properties
    public string? VideoUrl { get; set; }
    public NutritionInfoDto? NutritionInfo { get; set; }
}

public class NutritionInfoDto
{
    public int? Calories { get; set; }
    public decimal? Protein { get; set; }
    public decimal? Carbohydrates { get; set; }
    public decimal? Fat { get; set; }
    public decimal? SaturatedFat { get; set; }
    public decimal? TransFat { get; set; }
    public int? Cholesterol { get; set; }
    public decimal? Fiber { get; set; }
    public decimal? Sugar { get; set; }
    public int? Sodium { get; set; }
    public string? ServingSize { get; set; }
    public int? ServingsPerContainer { get; set; }
    public Dictionary<string, int>? Vitamins { get; set; }
    public Dictionary<string, int>? Minerals { get; set; }
    public List<string>? Allergens { get; set; }
}
```

### Entity Updates

Update `Product` entity:
```csharp
public class Product
{
    // ... existing properties
    public string? VideoUrl { get; set; }
    public string? NutritionInfoJson { get; set; } // Store as JSON
    
    [NotMapped]
    public NutritionInfoDto? NutritionInfo 
    { 
        get => string.IsNullOrEmpty(NutritionInfoJson) 
            ? null 
            : JsonSerializer.Deserialize<NutritionInfoDto>(NutritionInfoJson);
        set => NutritionInfoJson = value == null 
            ? null 
            : JsonSerializer.Serialize(value);
    }
}
```

## Usage Examples

### Video URL Formats Supported
- YouTube: `https://www.youtube.com/watch?v=VIDEO_ID`
- YouTube Short: `https://youtu.be/VIDEO_ID`
- Direct video: `https://example.com/video.mp4`

### Nutrition Info Example
```json
{
  "calories": 250,
  "protein": 15,
  "carbohydrates": 30,
  "fat": 8,
  "saturatedFat": 3,
  "fiber": 5,
  "sugar": 10,
  "sodium": 500,
  "servingSize": "1 piece (150g)",
  "servingsPerContainer": 4,
  "vitamins": {
    "Vitamin C": 50,
    "Vitamin A": 20
  },
  "minerals": {
    "Iron": 15,
    "Calcium": 200
  },
  "allergens": ["Gluten", "Dairy"]
}
```

## UI/UX Features

### Video Component
- ✅ Thumbnail preview with play button
- ✅ Full-screen modal player
- ✅ YouTube auto-detection
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Smooth animations

### Nutrition Component
- ✅ Expandable/collapsible design
- ✅ FDA-style nutrition label
- ✅ Daily value percentages
- ✅ Color-coded sections (vitamins, minerals, allergens)
- ✅ Allergen warnings with icons
- ✅ Mobile-friendly layout
- ✅ Dark mode support

## Display Location

Both features appear on the product detail page:
- **Video**: Shows after description, before stock info
- **Nutrition**: Shows after video (if present), before stock info

They only display if the product has `videoUrl` or `nutritionInfo` data.


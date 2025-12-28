/**
 * TypeScript types matching mobile app models
 */

export interface Business {
  businessId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: string;
  accentColor?: string;
  // Tax & Invoice Information (for GST compliance)
  gstNumber?: string;
  panNumber?: string;
  businessRegistrationNumber?: string;
  generateInvoice?: boolean;
  taxRate?: number;
  showTax?: boolean;
}

export interface NutritionInfo {
  calories?: number;
  protein?: number; // in grams
  carbohydrates?: number; // in grams
  fat?: number; // in grams
  saturatedFat?: number; // in grams
  transFat?: number; // in grams
  cholesterol?: number; // in mg
  fiber?: number; // in grams
  sugar?: number; // in grams
  sodium?: number; // in mg
  servingSize?: string;
  servingsPerContainer?: number;
  vitamins?: { [key: string]: number }; // e.g., { "Vitamin C": 50, "Vitamin A": 20 }
  minerals?: { [key: string]: number }; // e.g., { "Iron": 15, "Calcium": 200 }
  allergens?: string[]; // e.g., ["Gluten", "Dairy", "Nuts"]
}

export interface Product {
  productId: string;
  businessId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  additionalImages?: string[]; // Array of additional image URLs
  videoUrl?: string; // YouTube URL or direct video URL
  recipeUrl?: string; // Webpage link to recipe (used when video is not available)
  categoryId?: string;
  categoryName?: string;
  isAvailable: boolean;
  stockQuantity?: number;
  sku?: string;
  tags?: string[];
  nutritionInfo?: NutritionInfo;
  isVegetarian?: boolean; // true for veg, false for non-veg, undefined for not specified
  preparationTime?: number; // Preparation time in minutes
  isFeatured?: boolean; // Whether the product is featured
  // Recipe-specific data points
  views?: number; // Number of views
  likes?: number; // Number of likes/favorites
  rating?: number; // Average rating (0-5)
  difficulty?: 'Easy' | 'Medium' | 'Hard'; // Difficulty level
  servings?: number; // Number of servings
  cookTime?: number; // Cooking time in minutes
  totalTime?: number; // Total time (prep + cook) in minutes
  // Extended recipe fields (matching sample data structure)
  recipeName?: string; // Original recipe name
  translatedRecipeName?: string; // Translated recipe name
  ingredients?: string; // Ingredients list (comma-separated or array)
  translatedIngredients?: string; // Translated ingredients
  prepTimeInMins?: number; // Preparation time in minutes (from PrepTimeInMins)
  cookTimeInMins?: number; // Cooking time in minutes (from CookTimeInMins)
  totalTimeInMins?: number; // Total time in minutes (from TotalTimeInMins)
  cuisine?: string; // Cuisine type (e.g., "Indian", "Italian")
  course?: string; // Course type (e.g., "Side Dish", "Main Course")
  diet?: string; // Diet type (e.g., "Diabetic Friendly", "Vegetarian")
  instructions?: string; // Cooking instructions
  translatedInstructions?: string; // Translated instructions
}

export interface Category {
  categoryId: string;
  businessId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface Order {
  orderId: string;
  orderNumber: string;
  businessId: string;
  customerName?: string;
  customerPhone: string;
  customerEmail?: string;
  orderItems: OrderItem[];
  totalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  deliveryFee?: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  orderItemId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'COD' | 'RAZORPAY' | 'STRIPE' | 'GOOGLE_PAY' | 'PHONE_PE';
  enabled: boolean;
}

export interface Promotion {
  promotionId: string;
  businessId: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface Feedback {
  feedbackId: string;
  orderId?: string;
  productId?: string;
  customerPhone: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// Loyalty Points Types
export interface CustomerLoyaltyStatusDto {
  customerId: string;
  businessId: string;
  currentPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  tierId?: string;
  tierName: string;
  tierBadge: string; // BRONZE, SILVER, GOLD
  tierDiscountPercentage: number;
  pointsToNextTier: number;
  nextTierDiscountPercentage: number;
  availableRewards: LoyaltyRewardDto[];
  lastActivity: string;
}

export interface LoyaltyPointsTransactionDto {
  transactionId: string;
  transactionType: string; // EARNED, REDEEMED, EXPIRED, ADJUSTED
  points: number;
  pointsBefore: number;
  pointsAfter: number;
  description?: string;
  orderId?: string;
  orderNumber?: string;
  rewardId?: string;
  rewardName?: string;
  createdAt: string;
}

export interface RedeemPointsRequest {
  rewardId: string;
  businessId: string;
}

export interface RedeemPointsResponse {
  success: boolean;
  errorMessage?: string;
  pointsRedeemed: number;
  discountAmount: number;
  discountCode?: string;
  remainingPoints: number;
  promotionId?: string;
}

export interface LoyaltyRewardDto {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  discountAmount: number;
  type: string;
  isActive: boolean;
  createdAt: string;
  redemptionCount: number;
}

// Group Order Types
export interface GroupOrderDto {
  groupOrderId: string;
  businessId: string;
  businessName: string;
  createdByCustomerId?: string;
  createdByName: string;
  groupCode: string;
  name: string;
  description?: string;
  status: string; // ACTIVE, LOCKED, COMPLETED, CANCELLED
  splitType: string; // EQUAL, ITEM_BASED, CUSTOM
  lockedAt?: string;
  expiresAt?: string;
  finalOrderId?: string;
  createdAt: string;
  updatedAt: string;
  members: GroupOrderMemberDto[];
  items: GroupOrderItemDto[];
  totalAmount: number;
  itemCount: number;
  memberCount: number;
}

export interface GroupOrderMemberDto {
  groupOrderMemberId: string;
  customerId?: string;
  memberName?: string;
  memberPhone?: string;
  memberEmail?: string;
  role: string; // CREATOR, MEMBER
  status: string; // ACTIVE, LEFT, REMOVED
  assignedAmount?: number;
  joinedAt: string;
}

export interface GroupOrderItemDto {
  groupOrderItemId: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  specialInstructions?: string;
  addedByMemberId?: string;
  addedByName?: string;
  addedAt: string;
}

export interface CreateGroupOrderRequest {
  businessId: string;
  name: string;
  description?: string;
  splitType?: string; // EQUAL, ITEM_BASED, CUSTOM
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
}

export interface JoinGroupOrderRequest {
  groupCode: string;
  customerId?: string;
  memberName?: string;
  memberPhone?: string;
  memberEmail?: string;
}

export interface AddItemToGroupOrderRequest {
  productId: string;
  quantity: number;
  specialInstructions?: string;
}

export interface GroupOrderSplitDto {
  totalAmount: number;
  splitType: string;
  memberSplits: MemberSplitDto[];
}

export interface MemberSplitDto {
  memberId: string;
  memberName: string;
  amount: number;
  percentage: number;
  items: GroupOrderItemDto[];
}

export interface CheckoutGroupOrderRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderType?: string; // PICKUP, DELIVERY
  deliveryAddress?: string;
  specialInstructions?: string;
  paymentMethod?: string;
  discountAmount?: number;
  promotionCode?: string;
}


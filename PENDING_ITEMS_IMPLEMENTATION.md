# Pending Items Implementation Summary

## ✅ Completed (High Priority)

### 1. Profile Update API Integration
- **Backend:**
  - Added `UpdateProfileRequest` DTO in `AuthDtos.cs`
  - Added `UpdateProfileAsync` method to `IAuthService` and `AuthService`
  - Added `PUT /api/auth/profile` endpoint in `AuthController`
- **Frontend:**
  - Updated `web-customer/src/app/dashboard/settings/page.tsx` to call the API
  - Added `updateProfile` endpoint to API config
  - Updates auth store and localStorage on successful update

### 2. Group Order SignalR Real-time Updates
- **Frontend:**
  - Created `web-customer/src/services/groupOrderSignalRService.ts`
  - Supports connecting to GroupOrderHub
  - Handlers for: ItemAdded, ItemRemoved, MemberJoined, MemberLeft, OrderLocked, OrderCompleted
  - Auto-reconnect functionality
- **Integration:**
  - Can be integrated into `GroupOrderCart` and `GroupOrderPage` components

### 3. Loyalty Points Checkout Integration
- **Frontend:**
  - Updated `CheckoutLoyaltyPoints.tsx` to actually call redeem API
  - Shows points that will be earned
  - Displays available rewards
  - Handles redemption with proper error handling

## 🔄 In Progress / To Complete

### 4. "Add to Group Order" Button on Product Pages
**Location:** `web-customer/src/app/product/[productId]/page.tsx`

**Implementation needed:**
```typescript
// Check if user has active group order
const [activeGroupOrder, setActiveGroupOrder] = useState<GroupOrderDto | null>(null);

// Add button near "Add to Cart" button
{activeGroupOrder && (
  <button
    onClick={() => handleAddToGroupOrder(product, quantity)}
    className="..."
  >
    Add to Group Order
  </button>
)}
```

### 5. Points Redemption Modal
**Create:** `web-customer/src/components/PointsRedemptionModal.tsx`

**Features:**
- Display all available rewards
- Show points required vs available
- Confirmation dialog before redemption
- Success/error handling

### 6. Loyalty History Page
**Create:** `web-customer/src/app/dashboard/loyalty/page.tsx`

**Features:**
- Display transaction history
- Filter by date range
- Show points earned/redeemed
- Pagination

### 7. Wishlist Backend API
**Backend needed:**
- `POST /api/wishlist/add` - Add product to wishlist
- `GET /api/wishlist` - Get user's wishlist
- `DELETE /api/wishlist/{productId}` - Remove from wishlist
- Entity: `WishlistItem` with `UserId`, `ProductId`, `BusinessId`

### 8. Payment Links for Split Bills
**Location:** `web-customer/src/components/BillSplit.tsx`

**Features:**
- Generate payment links for each member
- Share via WhatsApp/Email
- Track payment status
- Integration with payment gateway

## 📝 Next Steps

1. Integrate Group Order SignalR into `GroupOrderCart` component
2. Add "Add to Group Order" button to product pages
3. Create Points Redemption Modal component
4. Create Loyalty History page
5. Implement Wishlist backend API
6. Add payment link generation for split bills


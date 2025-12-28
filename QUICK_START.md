# FlowCart Web-Customer - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd web-customer
npm install
```

### Step 2: Configure Environment
```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local and set your API URLs:
# NEXT_PUBLIC_API_URL=http://localhost:53898/api
# NEXT_PUBLIC_WS_URL=ws://localhost:53898/hubs
```

### Step 3: Run Development Server
```bash
npm run dev
```

The app will be available at **http://localhost:3001**

---

## ✨ New Features Available

### 💳 Payment Integration
- **Razorpay**: Fully integrated, ready to use
- **Stripe**: Integrated (requires Stripe Elements for card input)
- **COD**: Cash on delivery option

### 🔔 Real-time Updates
- Live order status updates via SignalR
- Connection indicator on order pages
- Automatic reconnection

### 🔐 User Authentication
- Login/Register pages
- Session persistence
- Protected routes
- User info in header

### ⭐ Product Reviews
- View reviews on product pages
- Submit reviews after order completion
- Star ratings (1-5)
- Review comments

### ❤️ Wishlist
- Add products to wishlist (heart icon)
- View wishlist page
- Persistent storage
- Quick access from header

---

## 📱 How to Use

### Shopping Flow
1. Enter Business ID on home page
2. Browse products in catalog
3. Add items to cart
4. Click cart icon to view cart
5. Proceed to checkout
6. Select payment method
7. Complete order
8. View order confirmation

### Authentication
- Click user icon in header to login/register
- User info pre-fills checkout form
- Session persists across page reloads

### Reviews
- View reviews on product detail pages
- Submit review after completing an order
- Rate products 1-5 stars
- Add optional comments

### Wishlist
- Click heart icon on product cards
- View all wishlist items from header
- Remove items by clicking heart again

---

## 🔧 Troubleshooting

### Payment Not Working?
- Check Razorpay/Stripe keys in backend
- Verify API endpoints are accessible
- Check browser console for errors

### SignalR Not Connecting?
- Verify WebSocket URL in .env.local
- Check backend SignalR hub is running
- Ensure authentication token is valid

### Reviews Not Showing?
- Verify customer phone is stored (after checkout)
- Check API endpoint is working
- Verify product/order IDs are correct

### Wishlist Not Persisting?
- Check browser localStorage is enabled
- Clear browser cache and try again
- Verify no browser restrictions

---

## 📚 Documentation

- **Full Features**: See `FEATURES_IMPLEMENTED.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Setup Guide**: See `SETUP.md`
- **Project Overview**: See `README.md`

---

## 🎯 Next Steps

1. Test all features end-to-end
2. Configure payment gateway keys
3. Test SignalR connection
4. Customize styling if needed
5. Deploy to production

---

**Ready to go!** 🎉


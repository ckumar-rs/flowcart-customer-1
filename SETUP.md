# FlowCart Web-Customer Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd web-customer
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API URLs
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3001`

## Project Structure

```
web-customer/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Home page (Business ID entry)
│   │   ├── catalog/            # Product catalog
│   │   ├── product/            # Product details
│   │   ├── checkout/           # Checkout page
│   │   ├── order/              # Order confirmation
│   │   └── orders/             # Order history
│   ├── components/             # Reusable components
│   │   ├── ProductCard.tsx
│   │   └── CartDrawer.tsx
│   ├── services/               # API services
│   │   ├── api/                # API configuration
│   │   ├── businessService.ts
│   │   ├── productService.ts
│   │   └── orderService.ts
│   ├── stores/                 # Zustand state management
│   │   ├── cartStore.ts
│   │   └── orderStore.ts
│   └── types/                  # TypeScript types
│       └── index.ts
└── public/                     # Static assets
```

## Features Implemented

✅ **Product Catalog**
- Browse products by business
- Category filtering
- Search functionality
- Responsive grid layout

✅ **Shopping Cart**
- Add/remove items
- Quantity management
- Persistent storage (localStorage)
- Cart drawer component

✅ **Product Details**
- Full product information
- Image display
- Quantity selector
- Add to cart

✅ **Checkout**
- Customer information form
- Payment method selection
- Order summary
- Order creation

✅ **Order Management**
- Order confirmation page
- Order history
- Order status tracking

## API Integration

This application reuses the same API endpoints as the mobile app:

- **Business API**: `/api/business/{id}`
- **Products API**: `/api/products/business/{businessId}`
- **Orders API**: `/api/orders`
- **Payments API**: `/api/payments`

All API calls are configured in `src/services/api/config.ts` and use the same structure as the mobile app.

## State Management

- **Cart Store** (Zustand): Manages shopping cart state with persistence
- **Order Store** (Zustand): Manages order state

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Primary Color**: #1D828E (Teal)
- **Background**: #FCFAF8 (Light off-white)

## Next Steps

1. **Payment Integration**: Implement Razorpay and Stripe payment flows
2. **Real-time Updates**: Add SignalR for live order status updates
3. **User Authentication**: Add customer login/registration
4. **Product Reviews**: Display and submit product reviews
5. **Wishlist**: Add wishlist functionality
6. **Search Enhancement**: Add voice search and filters

## Development

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Lint
npm run lint
```

## Deployment

The application can be deployed to:
- **Vercel** (Recommended for Next.js)
- **Netlify**
- **Azure Static Web Apps**
- **AWS Amplify**

Make sure to set environment variables in your deployment platform.


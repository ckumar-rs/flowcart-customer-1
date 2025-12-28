# FlowCart Web-Customer

A React-based web application for customers to browse products, place orders, and manage their orders seamlessly across web and mobile platforms.

## Features

- 🛍️ **Product Catalog** - Browse products by category
- 🔍 **Search & Filter** - Find products quickly
- 🛒 **Shopping Cart** - Add/remove items, manage quantities
- 💳 **Guest Checkout** - Place orders without login (phone number required)
- 🔐 **Optional Login** - Login for faster checkout and order history
- 💳 **Payment Options** - Razorpay, Stripe, COD
- 📦 **Order Management** - View order history by phone number
- 🔔 **Real-time Updates** - Live order status updates via SignalR
- ⭐ **Product Reviews** - View and submit reviews
- ❤️ **Wishlist** - Save favorite products
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

- **Framework:** Next.js 14 (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **API Client:** Axios
- **Real-time:** SignalR
- **Forms:** React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app will be available at `http://localhost:3001`

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:53898/api
NEXT_PUBLIC_WS_URL=ws://localhost:53898/hubs
```

## Project Structure

```
web-customer/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # Reusable UI components
│   ├── services/         # API services
│   ├── stores/           # Zustand state management
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── styles/           # Global styles
├── public/               # Static assets
└── package.json
```

## API Integration

This application reuses the same APIs as the mobile app. All API endpoints are defined in `src/services/api/` and follow the same structure as the mobile app's API configuration.

## Guest Checkout

**No login required!** Customers can:
- Browse and shop without creating an account
- Place orders using phone number
- Track orders by phone number
- Submit reviews with phone number

**Login is optional** and provides:
- Faster checkout (pre-filled forms)
- Easy order history access
- Account-linked reviews

See `GUEST_CHECKOUT.md` for details.

## Additional Features (Future)

- [ ] Voice search
- [ ] QR code scanning
- [ ] Product recommendations
- [ ] Backend wishlist sync

## License

Proprietary - FlowCart Platform


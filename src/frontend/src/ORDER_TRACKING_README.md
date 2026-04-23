# Delivery Status Tracking System - Frontend Implementation

## Overview
The Delivery Status Tracking System allows users to monitor their orders and view real-time delivery status updates. Users can see their orders progress through different stages: **Processing** → **In Transit** → **Delivered**.

## Features

### 1. **Real-time Order Tracking**
- View all placed orders with their current status
- See detailed delivery timeline for each order
- Visual progress indicators for each delivery stage
- Estimated delivery dates (for in-transit orders)

### 2. **Three Delivery Statuses**
- **Processing**: Order has been placed and is being prepared for shipment
- **In Transit**: Order has been shipped and is on the way
- **Delivered**: Order has been successfully delivered

### 3. **Order Information Display**
- Order ID and placement date
- Order status badge (color-coded)
- Delivery timeline with timestamps
- Delivery address
- Order items list with quantities and prices
- Order total amount

### 4. **User-Friendly Interface**
- Responsive design (mobile-friendly)
- Color-coded status badges
- Animated progress indicators
- Clean, modern styling with Material-UI components
- Empty state for users with no orders yet

## File Structure

```
src/frontend/src/
├── pages/
│   └── OrderTrackingPage.jsx          # Main tracking page component
├── services/
│   └── orderTrackingService.js        # API service for order/delivery data
└── styles/
    └── OrderTracking.css              # Component styling
```

## Component Details

### OrderTrackingPage.jsx
**Location**: `/src/frontend/src/pages/OrderTrackingPage.jsx`

**Purpose**: Main page component that displays user's orders and their delivery status

**Key Features**:
- Fetches user's orders and delivery information
- Redirects to login if user is not authenticated
- Displays loading state while fetching data
- Shows empty state when user has no orders
- Renders tracking timeline for each order
- Shows delivery address and order items

**Props**:
- `isLoggedIn` (boolean): Authentication state

**Key Functions**:
- `getStatusInfo(status)`: Returns status-specific information including steps and styling
- `renderTrackingTimeline(order)`: Renders the delivery progress timeline for an order
- `formatDate(date)`: Formats dates to readable format
- `formatTime(date)`: Formats times to readable format

### orderTrackingService.js
**Location**: `/src/frontend/src/services/orderTrackingService.js`

**Purpose**: Provides API functions to fetch order and delivery data

**API Endpoints**:
```javascript
// Get all orders for logged-in user
getUserOrders()

// Get specific order details
getOrderById(orderId)

// Get delivery status for an order
getDeliveryStatus(orderId)

// Get all deliveries for logged-in user
getUserDeliveries()
```

**Features**:
- Automatic authentication header handling with Bearer token
- Comprehensive error handling
- Error messages from API responses
- Support for graceful degradation if delivery data is not yet available

### OrderTracking.css
**Location**: `/src/frontend/src/styles/OrderTracking.css`

**Contains Styling For**:
- Order cards with hover effects
- Status badges (color-coded)
- Tracking timeline with animated progress indicators
- Order items display
- Delivery address section
- Responsive mobile layout

**Color Scheme**:
- Processing: Yellow (#fff3cd)
- In Transit: Blue (#cfe2ff)
- Delivered: Green (#d1e7dd)
- Primary: Purple gradient (#667eea to #764ba2)

## Integration with App

### Route Added
```javascript
<Route path="/order-tracking" element={<OrderTrackingPage isLoggedIn={isLoggedIn} />} />
```

### Header Navigation Updated
Added "Track Orders" link in user dropdown menu:
- Only visible when user is logged in
- Navigates to `/order-tracking` page

## Backend Requirements

The following backend endpoints are required for full functionality:

### 1. Get User Orders
```
GET /api/orders
Headers: Authorization: Bearer {token}
Response:
[
  {
    id: string,
    order_date: ISO datetime,
    created_at: ISO datetime,
    status: 'processing' | 'in-transit' | 'delivered',
    total_price: number,
    items: [
      {
        product_name: string,
        name: string,
        quantity: number,
        price: number
      }
    ]
  }
]
```

### 2. Get User Deliveries
```
GET /api/deliveries
Headers: Authorization: Bearer {token}
Response:
[
  {
    order_id: string,
    status: 'processing' | 'in-transit' | 'delivered',
    delivery_address: string,
    estimated_delivery: ISO datetime (optional)
  }
]
```

### 3. Get Order by ID (Optional)
```
GET /api/orders/{orderId}
Headers: Authorization: Bearer {token}
Response: Order object (see above)
```

### 4. Get Delivery Status (Optional)
```
GET /api/deliveries/status/{orderId}
Headers: Authorization: Bearer {token}
Response:
{
  order_id: string,
  status: string,
  delivery_address: string,
  estimated_delivery: ISO datetime (optional)
}
```

## Usage

### For Users
1. Log in to your account
2. Click on user menu (account icon) in header
3. Select "Track Orders"
4. View your orders and their delivery status
5. Check the timeline for each order to see its progress

### For Developers

**To integrate with your backend**:

1. Update the API endpoints in `orderTrackingService.js` if they differ from the default `/api/orders` and `/api/deliveries`

2. Ensure your backend returns order data in the expected format:
```javascript
{
  id: order_id,
  order_date: datetime,
  status: 'processing' | 'in-transit' | 'delivered',
  total_price: number,
  items: [{
    product_name: string,
    quantity: number,
    price: number
  }]
}
```

3. Ensure your backend returns delivery data in the expected format:
```javascript
{
  order_id: order_id,
  status: 'processing' | 'in-transit' | 'delivered',
  delivery_address: string
}
```

## Status Flow

```
Order Placed
    ↓
Payment Confirmed
    ↓
Preparing for Shipment (Processing Status)
    ↓
Shipped (In Transit Status)
    ↓
In Transit
    ↓
Delivered (Delivered Status)
```

## Error Handling

The component handles various error scenarios:
- **Not authenticated**: Redirects to login page
- **API errors**: Displays error message to user
- **No orders**: Shows empty state with "Browse Products" button
- **Missing delivery data**: Gracefully continues without delivery information

## Styling Features

### Responsive Design
- Full-width on mobile devices
- Adjusted spacing and font sizes
- Stacked layout on smaller screens
- Touch-friendly buttons and links

### Visual Indicators
- Animated pulse effect for "in-progress" status
- Color-coded status badges
- Timeline visualization with completed/pending steps
- Hover effects on order cards

### Accessibility
- Semantic HTML structure
- Proper color contrast
- Clear labels and descriptions
- Keyboard-navigable menu items

## Testing Considerations

### Mock Data for Development
During development without backend, you can test with mock orders:

```javascript
const mockOrders = [
  {
    id: 'ORD-001',
    order_date: new Date(Date.now() - 86400000),
    status: 'in-transit',
    total_price: 299.99,
    items: [
      { product_name: 'Laptop', quantity: 1, price: 299.99 }
    ]
  }
];
```

### Manual Testing Checklist
- [ ] Login required to view orders
- [ ] Empty state displays when no orders exist
- [ ] Orders load correctly with all information
- [ ] Status badges show correct colors
- [ ] Timeline renders all steps
- [ ] Responsive layout works on mobile
- [ ] Error messages display correctly
- [ ] Navigation links work properly

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live status updates
2. **Notifications**: Email/SMS notifications on status changes
3. **Print Invoice**: Print or download invoice for each order
4. **Return Requests**: Initiate return/refund requests from tracking page
5. **Tracking Events**: Detailed event logs (e.g., "Package picked up", "Out for delivery")
6. **Customer Support**: Chat with support about specific orders
7. **Rating & Reviews**: Quick access to rate products from past orders
8. **Notifications Preferences**: Customize how users receive updates

## Related Features

- [Shopping Cart System](../SHOPPING_CART_README.md)
- [Payment Methods](./PAYMENT_README.md)
- Ratings & Comments System
- Wishlist System
- Return & Refund Management

## Notes

- The component automatically handles authentication redirect
- Delivery data is optional - the system works even if only order status is available
- Timestamps are formatted based on user's browser locale
- All amounts are displayed in USD (customizable)
- The system supports any number of orders per user

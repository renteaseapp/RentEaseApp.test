# RentEase Web Application

A modern rental marketplace platform built with React, TypeScript, and Tailwind CSS.

## Features

### 🔍 **Enhanced Search & Filter System**
- **Real-time Search**: Search through your product listings with debounced input
- **Status Filtering**: Filter by availability status (Available, Rented Out, Pending Approval, etc.)
- **Admin Status Filtering**: Filter by admin approval status (Pending, Approved, Rejected)
- **Pagination**: Navigate through large lists of products
- **Clear Filters**: Easy way to reset search and filter criteria

### 🎯 **Key Features**
- **Multi-language Support**: Thai and English
- **Responsive Design**: Works on all devices
- **Role-based Access**: User, Owner, and Admin dashboards
- **Real-time Updates**: Live status updates and notifications
- **Image Management**: Upload and manage product images
- **Payment Integration**: Secure payment processing
- **Chat System**: Direct communication between users
- **Claims & Disputes**: Resolution system for rental issues

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

## MyListingsPage Search Features

The MyListingsPage now includes a fully functional search and filter system:

### Search Functionality
- **Debounced Search**: Waits 500ms after user stops typing before searching
- **Real-time Results**: Shows results as you type
- **Search by**: Product title, description, category, and other product details

### Filter Options
- **Availability Status**: Available, Rented Out, Pending Approval, Unavailable, Draft
- **Admin Approval Status**: Pending, Approved, Rejected
- **Combined Filters**: Use search and status filters together

### UI Improvements
- **Loading States**: Shows loading indicators during search
- **Result Count**: Displays current page and total results
- **Clear Filters**: One-click button to reset all filters
- **Responsive Design**: Works perfectly on mobile and desktop
- **Visual Feedback**: Color-coded status badges and hover effects

### Pagination
- **Smart Pagination**: Shows up to 5 page numbers at a time
- **Previous/Next**: Easy navigation between pages
- **Page Info**: Shows "Showing X to Y of Z items"

## API Integration

The search functionality integrates with the backend API:
- **Endpoint**: `GET /api/owners/me/products`
- **Parameters**: `q` (search), `status` (filter), `page`, `limit`
- **Authentication**: JWT Bearer token required
- **Response**: Paginated product data with metadata

## Technology Stack

- **Frontend**: React 19.1.0, TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM 7.6.1
- **Internationalization**: i18next
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **State Management**: React Context API

## Project Structure

```
rentease-web/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── features/           # Feature-based components
│   ├── owner/         # Owner dashboard features
│   │   └── MyListingsPage.tsx  # Enhanced with search & filter
│   └── ...
├── services/           # API service functions
├── public/locales/     # Translation files
└── types.ts           # TypeScript definitions
```

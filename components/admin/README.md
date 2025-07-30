# Admin Components

This directory contains the admin-specific components that have been separated from the main Navbar component for better organization and maintainability.

## Components

### AdminSidebar
- **File**: `AdminSidebar.tsx`
- **Purpose**: Provides the collapsible sidebar navigation for admin pages
- **Features**:
  - Collapsible design (64px when collapsed, 256px when expanded)
  - Beautiful gradient design with animations
  - User profile section with logout functionality
  - Color-coded navigation items
  - Smooth transitions and hover effects

### AdminLayout
- **File**: `AdminLayout.tsx`
- **Purpose**: Main layout wrapper for admin pages
- **Features**:
  - Integrates with AdminSidebar
  - Responsive design that adapts to sidebar state
  - Beautiful header with glass morphism effect
  - Animated content transitions
  - Gradient background

## Usage

```tsx
import { AdminLayout } from '../../components/admin/AdminLayout';

const AdminPage = () => {
  return (
    <AdminLayout>
      {/* Your admin page content */}
    </AdminLayout>
  );
};
```

## Props

### AdminSidebar Props
- `isCollapsed?: boolean` - Controls the collapsed state of the sidebar
- `onToggleCollapse?: (collapsed: boolean) => void` - Callback when toggle button is clicked

### AdminLayout Props
- `children?: React.ReactNode` - The content to be rendered inside the layout

## Translation Keys

The components use the following translation keys:
- `adminSidebar.dashboard`
- `adminSidebar.users`
- `adminSidebar.products`
- `adminSidebar.categories`
- `adminSidebar.complaints`
- `adminSidebar.reports`
- `adminSidebar.toggleSidebar`
- `adminSidebar.userProfile`
- `adminSidebar.logout`
- `navbar.adminPanel`

## Dependencies

- `framer-motion` - For animations
- `react-icons/fa` - For icons
- `react-i18next` - For internationalization
- `react-router-dom` - For navigation 
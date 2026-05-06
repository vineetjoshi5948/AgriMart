# AgriMart Farmer Dashboard - File Structure

This project has been separated into a modular file structure for better organization and maintainability.

## Folder Structure

```
farmer/
├── index.html              # Main application file (contains all pages and layout)
├── dashboard1.html         # Dashboard page content
├── inventory.html          # My Store / Inventory page
├── earnings.html           # Analytics / Earnings page
├── orders.html             # Orders management page
├── profile.html            # User profile page
├── add-product.html        # Add product modal
├── manage-products.html    # Product management page
├── css/
│   └── style.css           # All CSS styles (extracted from original)
└── js/
    └── script.js           # All JavaScript functionality
```

## File Descriptions

### Main Files
- **index.html** - The main application file containing:
  - Sidebar navigation
  - Top navigation bar
  - All page structures (dashboard, mystore, analytics, orders, messages, team, profile, notifications, settings)
  - Modal overlays
  - External CSS and JS references

### Page Files (Individual Components)
Each page file contains just the page content without the layout wrapper:

- **dashboard1.html** - Dashboard overview with stats, recent orders, tasks, and revenue chart
- **inventory.html** - Product inventory grid with add, edit, and delete functionality
- **earnings.html** - Analytics page with revenue trends, sales by category, and top products
- **orders.html** - Orders table with filtering and status management
- **profile.html** - User profile with personal information and farm details
- **add-product.html** - Modal for adding new products
- **manage-products.html** - Comprehensive product management table

### Assets

#### CSS (css/style.css)
Contains all styling including:
- Variables (colors, sizing)
- Layout (sidebar, navbar, content area)
- Components (cards, buttons, tables, forms, modals)
- Responsive design
- Dark mode support

#### JavaScript (js/script.js)
Contains all functionality including:
- Page navigation and routing
- Sidebar toggle
- Dark mode toggle
- Todo list management
- Chat functionality
- Modal interactions
- Responsive auto-collapse

## How to Use

### For Single Page Application
Open `index.html` in a browser. All pages are included in the file and navigation works through the sidebar.

### For Modular Development
Individual page files can be:
- Imported into frameworks (React, Vue, Angular)
- Used as templates for server-side rendering
- Processed with build tools
- Split further for component-based architecture

## Integration Examples

### With a Framework
```javascript
// React example
import Dashboard from './pages/dashboard1.html'
import Inventory from './pages/inventory.html'

function App() {
  return (
    <Layout>
      <Router>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/inventory" component={Inventory} />
      </Router>
    </Layout>
  )
}
```

### With Server-Side Templating
```php
// PHP example
include 'layout/sidebar.php';
include 'layout/navbar.php';
include 'pages/dashboard1.php';
include 'layout/footer.php';
```

## Features Included

✅ Responsive Design (Mobile, Tablet, Desktop)
✅ Dark Mode Toggle
✅ Sidebar Navigation with Collapse
✅ Multiple Dashboard Pages
✅ Product Management
✅ Order Tracking
✅ Analytics & Reporting
✅ User Profile Management
✅ Messaging System
✅ Todo Task List
✅ Modal Dialogs
✅ Form Validation Ready
✅ Color-coded Status Badges
✅ Chart Visualizations

## Customization

### Colors
Edit CSS variables in `css/style.css`:
```css
:root {
  --green: #2D6A4F;
  --gold: #E9A820;
  --dark: #1B2027;
  /* ... more colors */
}
```

### Navigation
Modify sidebar menu items in `index.html` `<sidebar>` section

### Pages
Add new pages by:
1. Creating new `.html` file in farmer/
2. Adding corresponding page div in index.html
3. Adding menu item to sidebar
4. Creating route in js/script.js

## Browser Support

- Chrome/Edge (Latest)
- Firefox (Latest)
- Safari (Latest)
- Mobile browsers

## Dependencies

- Boxicons (CDN): Font icons
- Google Fonts (CDN): Typography

All dependencies are loaded via CDN in index.html

---

**Version**: 1.0
**Last Updated**: April 27, 2026
**License**: MIT

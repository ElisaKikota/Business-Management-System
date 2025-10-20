# Business Management System

A comprehensive business management system built with React, TypeScript, Vite, and Firebase. This system is designed to handle the complete order-to-delivery workflow for businesses with multiple store locations.

## Features

### Core Functionality
- **Business Registration**: System admin/CEO can register their business with complete setup
- **Order Management**: Complete order workflow from creation to delivery
- **Inventory Management**: Multi-store inventory with transfer capabilities
- **Customer Management**: Customer database with credit management
- **Sales Tracking**: Sales dashboard and reporting
- **Transport & Delivery**: Delivery management and tracking
- **Invoicing**: Invoice generation and payment tracking
- **Reports & Analytics**: Business insights and analytics
- **System Administration**: User management and system configuration

### Technical Features
- **Scalable Architecture**: Multi-tenant system where each business has its own Firebase collection
- **Role-based Access**: Different access levels for different user roles
- **Real-time Updates**: Firebase integration for real-time data synchronization
- **Professional UI**: Clean, modern interface with white/blue theme and gradient cards
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with custom components
- **Backend**: Firebase (Authentication, Firestore, Analytics)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **State Management**: React Context API

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── Header.tsx      # Top header with user menu
│   └── ProtectedRoute.tsx # Route protection
├── contexts/           # React contexts for state management
│   ├── AuthContext.tsx # Authentication context
│   └── BusinessContext.tsx # Business management context
├── pages/              # Page components
│   ├── Login.tsx       # User authentication
│   ├── BusinessRegistration.tsx # Business setup
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Orders.tsx      # Order management
│   ├── Inventory.tsx   # Inventory management
│   ├── Customers.tsx   # Customer management
│   ├── Sales.tsx       # Sales tracking
│   ├── Transport.tsx   # Delivery management
│   ├── Invoicing.tsx   # Invoice management
│   ├── Reports.tsx     # Analytics and reports
│   └── Settings.tsx    # System administration
├── config/
│   └── firebase.ts     # Firebase configuration
├── App.tsx             # Main app component with routing
├── main.tsx           # App entry point
└── index.css          # Global styles and Tailwind imports
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project setup

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd business-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Update `src/config/firebase.ts` with your Firebase configuration
   - Enable Authentication and Firestore in your Firebase console

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Business Workflow

The system follows the business workflow as outlined in the flowchart:

1. **Order Initiation**: Orders can be created by customers (via link page or account) or sales team
2. **Order Processing**: Credit orders require eligibility check, all orders need CEO/Sales approval
3. **Inventory Management**: System checks if all items are in main store or need to be sourced from sub-stores
4. **Order Preparation**: Inventory managers and packers are notified to prepare orders
5. **Transport & Delivery**: Orders are transported based on customer location (local or cargo)
6. **Invoicing**: Invoices are generated with transport details

## Multi-Store Inventory Transfer

The system includes comprehensive inventory transfer functionality:
- Transfer requests between stores
- Transfer approval workflow
- Transfer tracking and history
- Central point consolidation (default: main shop)

## Firebase Structure

Each business gets its own main collection in Firebase:

```
businesses/
  └── {businessId}/
      ├── settings/
      ├── orders/
      ├── inventory/
      ├── customers/
      ├── users/
      └── transfers/
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

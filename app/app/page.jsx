// filename: app/page.js
'use client'; // <-- IMPORTANT: Make this a Client Component

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Use the actual Next.js Link
import { jwtDecode } from 'jwt-decode'; // Import library to decode JWT

// Define routes
const ROUTES = {
  LOGIN: '/login',
  PRODUCTS: '/products',
  ORDERS: '/my-orders',
  // --- UPDATED SUPPLIER ROUTES ---
  SUPPLIER_PRODUCTS: '/supplier/products', // Specific page for product management
  SUPPLIER_ORDERS: '/supplier/orders',   // Specific page for incoming orders
  MARKETS: '/markets',
  COMMUNITY: '/community',
  // Add future routes if needed
  // SUPPLIER_REVIEWS: '/supplier/reviews',
  // PROFILE_SETTINGS: '/profile/settings',
};

// --- Utility Component for Primary Cards ---
const ActionCard = ({ title, description, linkText, linkHref, colorClass, iconSvg }) => {
  // Define explicit mappings for button colors based on the border color class
  const buttonColorMap = {
    'border-amber-500': 'bg-amber-500 hover:bg-amber-600',
    'border-blue-500': 'bg-blue-500 hover:bg-blue-600',
    'border-purple-500': 'bg-purple-500 hover:bg-purple-600',
    'border-teal-500': 'bg-teal-500 hover:bg-teal-600',
    'border-green-600': 'bg-green-600 hover:bg-green-700',
    'border-yellow-500': 'bg-yellow-500 hover:bg-yellow-600',
    'border-gray-500': 'bg-gray-500 hover:bg-gray-600',
  };

  // Define explicit mappings for icon colors
   const iconColorMap = {
    'border-amber-500': 'bg-amber-100 text-amber-500',
    'border-blue-500': 'bg-blue-100 text-blue-500',
    'border-purple-500': 'bg-purple-100 text-purple-500',
    'border-teal-500': 'bg-teal-100 text-teal-500',
    'border-green-600': 'bg-green-100 text-green-600',
    'border-yellow-500': 'bg-yellow-100 text-yellow-500',
    'border-gray-500': 'bg-gray-100 text-gray-500',
  };

  const buttonClasses = buttonColorMap[colorClass] || 'bg-gray-500 hover:bg-gray-600'; // Default gray if color unknown
  const iconClasses = iconColorMap[colorClass] || 'bg-gray-100 text-gray-500';

  return (
    // Use the main colorClass for the border-top
    <div className={`p-6 sm:p-8 rounded-xl shadow-lg border-t-8 ${colorClass} bg-white flex flex-col justify-between h-full transition duration-300 hover:shadow-2xl`}>
      <div className="text-center">
        {/* Use mapped classes for the icon */}
        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${iconClasses}`}>
           {iconSvg || <span className="text-xl">ℹ️</span>} {/* Fallback icon */}
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6 text-sm">{description}</p>
      </div>
      {linkText && linkHref && (
         <Link
            href={linkHref}
            // Use mapped classes for the button
            className={`w-full text-center py-3 rounded-xl font-bold text-white transition duration-200 shadow-md ${buttonClasses}`}
         >
            {linkText}
         </Link>
      )}
    </div>
  );
};


export default function HomePage() {
  const [userRole, setUserRole] = useState(null); // 'VENDOR', 'SUPPLIER', or null
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for token on component mount
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedToken = jwtDecode(token); // Decode the token
        // Basic validation of decoded token structure
        if (decodedToken && typeof decodedToken === 'object' && decodedToken.role) {
            setUserRole(decodedToken.role); // Set the user's role
        } else {
             console.error("Invalid token structure:", decodedToken);
             localStorage.removeItem('authToken'); // Clear invalid token
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem('authToken'); // Clear invalid token
      }
    }
    setIsLoading(false); // Finished checking
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUserRole(null); // Update state to reflect logout
    console.log("User logged out.");
    // Optionally redirect to login page: router.push('/login');
  };

  // --- Render logic based on loading and user role ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    ); // Show loading indicator
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-10 font-inter">

      <header className="text-center mb-8 max-w-3xl mx-auto">
        <Link href="/" className="flex items-center justify-center mx-auto mb-4 hover:opacity-80 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600 mr-3" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
          </svg>
          <h1 className="text-4xl font-extrabold text-gray-900">Supply Setu</h1>
        </Link>
        <p className="text-xl text-gray-600 mt-2">
          Solving the supply chain problem for street food. <span className="text-amber-500 font-semibold">Quality, Affordability, and Trust Guaranteed.</span>
        </p>
      </header>

      {/* Conditional Content Area */}
      <div className="max-w-4xl mx-auto">
        {/* --- Logged Out View --- */}
        {!userRole && (
          <div className="text-center bg-white p-8 rounded-xl shadow-lg">
             <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome!</h2>
             <p className="text-gray-600 mb-6">Please log in or register to access the platform.</p>
             <Link href={ROUTES.LOGIN} className="inline-block bg-green-600 text-white py-3 px-8 rounded-xl font-bold hover:bg-green-700 transition duration-200 shadow-md">
               Login or Register Here
             </Link>
          </div>
        )}

        {/* --- Vendor View --- */}
        {userRole === 'VENDOR' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ActionCard
              title="Browse Products"
              description="Find ingredients from local, verified suppliers."
              linkText="View Products & Order"
              linkHref={ROUTES.PRODUCTS}
              colorClass="border-amber-500"
              iconSvg={null} // Replace null with actual SVG code later
            />
            <ActionCard
              title="My Orders"
              description="Track your deliveries, view past order details, and manage your purchase history easily."
              linkText="View Order History"
              linkHref={ROUTES.ORDERS}
              colorClass="border-blue-500"
              iconSvg={null} // Replace null with actual SVG code later
            />
            <ActionCard
              title="Community Hub"
              description="Connect with fellow vendors in your pincode! Share tips, ask questions, and explore group buying."
              linkText="Join Pincode Chat"
              linkHref={ROUTES.COMMUNITY}
              colorClass="border-purple-500"
              iconSvg={null} // Replace null with actual SVG code later
            />
            <ActionCard
              title="Live Market Deals"
              description="Don't miss out! Grab limited-time deals directly from suppliers in fast-paced, real-time events."
              linkText="Find Active Markets"
              linkHref={ROUTES.MARKETS}
              colorClass="border-teal-500"
              iconSvg={null} // Replace null with actual SVG code later
            />
          </div>
        )}

        {/* --- Supplier View --- */}
        {userRole === 'SUPPLIER' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ActionCard
              title="Manage Products"
              description="Add, update, and manage your product inventory and listings."
              linkText="Go to Product Management"
              linkHref={ROUTES.SUPPLIER_PRODUCTS} // <-- UPDATED LINK
              colorClass="border-green-600"
              iconSvg={null} // Replace null with actual SVG code later
            />
            <ActionCard
              title="View Incoming Orders"
              description="See new orders from vendors and manage fulfillment status."
              linkText="Check Incoming Orders"
              linkHref={ROUTES.SUPPLIER_ORDERS} // <-- UPDATED LINK
              colorClass="border-blue-500"
              iconSvg={null} // Replace null with actual SVG code later
            />
            <ActionCard
              title="Live Markets"
              description="Start real-time market events or view active markets."
              linkText="Go to Markets"
              linkHref={ROUTES.MARKETS} // Still links to global market page
              colorClass="border-teal-500"
              iconSvg={null} // Replace null with actual SVG code later
            />
            <ActionCard
              title="My Reputation"
              description="View reviews and ratings submitted by vendors."
              linkText="View Reviews (Coming Soon)"
              linkHref="#" // Link to '#' for now
              colorClass="border-yellow-500"
              iconSvg={null} // Replace null with actual SVG code later
            />
            <ActionCard
              title="Account Settings"
              description="Update your company profile, contact details, and location."
              linkText="Edit Profile (Coming Soon)"
              linkHref="#" // Link to '#' for now
              colorClass="border-gray-500"
              iconSvg={null} // Replace null with actual SVG code later
            />
          </div>
        )}
      </div>

      {/* Footer/Logout Button */}
      {userRole && (
        <footer className="mt-12 text-center">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white py-2 px-6 rounded-lg font-semibold hover:bg-red-600 transition duration-200 shadow"
          >
            Logout
          </button>
        </footer>
      )}
    </div>
  );
}
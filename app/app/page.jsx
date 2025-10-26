'use client';

// Removed useState and all internal view components (ProductDiscoveryView, etc.)
// to allow the links to rely on external routing (your actual pages).

// Define the exact routes (as requested)
const ROUTES = {
    LOGIN: '/login',
    PRODUCTS: '/products',
    ORDERS: '/my-orders',
    SUPPLIER_DASHBOARD: '/supplier/dashboard',
};

// Placeholder for Link component that simply uses an anchor tag
// If you are running this in a Next.js environment, replace this component 
// with 'import Link from "next/link";' and use the native Link component.
const Link = ({ href, children, className }) => (
    <a href={href} className={className}>
        {children}
    </a>
);

// --- Utility Component for Primary Cards ---
const ActionCard = ({ title, description, linkText, linkHref, colorClass, iconSvg }) => {
    // Determine the base color (e.g., 'amber-500', 'blue-500', 'green-600')
    const colorParts = colorClass.split('-');
    const baseColor = colorParts[1] + '-' + colorParts[2];

    // Map base color to primary button class (e.g., bg-amber-500)
    const buttonBgClass = `bg-${baseColor}`;
    // Map base color to hover/shadow class (e.g., hover:bg-amber-600)
    const buttonHoverClass = `hover:bg-${colorParts[1]}-${parseInt(colorParts[2]) + 1}`;


    return (
        <div className={`p-6 sm:p-8 rounded-xl shadow-lg border-t-8 ${colorClass} bg-white flex flex-col justify-between h-full transition duration-300 hover:shadow-2xl`}>
            <div className="text-center">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${colorClass.replace('border-t-8', 'bg').replace(/[0-9]/, '100').replace('border-', 'text-')}`}>
                    {iconSvg}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
                <p className="text-gray-600 mb-6 text-sm">{description}</p>
            </div>
            <Link 
                href={linkHref}
                // FIX: Ensured background and text color are set for visibility
                className={`w-full text-center py-3 rounded-xl font-bold text-white transition duration-200 shadow-md ${buttonBgClass} ${buttonHoverClass}`}
            >
                {linkText}
            </Link>
        </div>
    );
};


export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-10 font-inter">
      
      {/* Header and Callout */}
      <header className="text-center mb-8 max-w-3xl mx-auto">
        {/* The Home button now links to the root page */}
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

      {/* Main Content Area: Now directly shows the cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Vendor - Product Discovery (View Products) */}
          <ActionCard
              title="Vendors: View Products"
              description="Find clean, high-quality ingredients from local, verified suppliers with fixed, transparent pricing."
              linkText="Browse Products & Order"
              linkHref={ROUTES.PRODUCTS}
              colorClass="border-amber-500"
              iconSvg={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
              }
          />

          {/* Card 2: Vendor - Orders (View My Orders) */}
          <ActionCard
              title="Vendors: View My Orders"
              description="Track current orders, view digital proofs, and manage clear payment history and follow-up records."
              linkText="View My Orders"
              linkHref={ROUTES.ORDERS}
              colorClass="border-blue-500"
              iconSvg={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M16 11l-4 4-4-4"/>
                  </svg>
              }
          />

          {/* Card 3: Supplier - Dashboard */}
          <ActionCard
              title="Suppliers: Dashboard"
              description="Gain order visibility, confirm vendor identity, track payments, and optimize fixed, predictable orders."
              linkText="Go to Supplier Dashboard"
              linkHref={ROUTES.SUPPLIER_DASHBOARD}
              colorClass="border-green-600"
              iconSvg={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><path d="M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z"/>
                  </svg>
              }
          />
      </div>

      {/* Footer/Auth Link */}
      <footer className="mt-12 text-center">
        <div className="text-lg font-medium">
            Ready to join the hub? 
            <Link href={ROUTES.LOGIN} className="text-green-600 hover:text-green-800 underline ml-1">
                Login or Register Here
            </Link>.
        </div>
      </footer>

    </div>
  );
}

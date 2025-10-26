'use client';

import { useState } from 'react';
// const router = useRouter(); // Removed next/navigation import and usage

// Load Lucide icons for visual enhancement (using inline SVG is better but for quick icons, this works)
// Note: In a real Next.js environment, you would import icons, but here we proceed assuming the environment handles Tailwind classes.
// For this single-file React environment, we will use placeholders or simple text until we are explicitly asked to use an icon library via CDN/npm.

export default function LoginPage() {
  // We cannot use useRouter() from next/navigation in this environment.
  // We'll manage state locally for demonstration.
  const [message, setMessage] = useState('');

  // --- State Management ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // State for toggling between login and register views
  const [isRegister, setIsRegister] = useState(false);
  // State for choosing role in registration
  const [role, setRole] = useState('VENDOR');

  // Common registration fields
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // --- Location state ---
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Vendor-specific fields
  const [vendorProfile, setVendorProfile] = useState({
    firstName: '', lastName: '', address: '', pincode: '', phoneNumber: '', foodType: ''
  });

  // Supplier-specific fields
  const [supplierProfile, setSupplierProfile] = useState({
    companyName: '', warehouseAddress: '', pincode: '', contactPerson: '', gstId: '', deliveryVehicles: '', minOrderValue: ''
  });

  // --- Handlers for Form Input Changes ---
  const handleVendorChange = (e) => setVendorProfile({ ...vendorProfile, [e.target.name]: e.target.value });
  const handleSupplierChange = (e) => setSupplierProfile({ ...supplierProfile, [e.target.name]: e.target.value });

  // --- Function to get current location ---
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsFetchingLocation(true);
    setLocationError('');
    setMessage(''); // Clear previous messages

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsFetchingLocation(false);
        setMessage('Location fetched successfully!');
      },
      (error) => {
        console.error("Geolocation Error:", error);
        setLocationError(`Error getting location: ${error.message}. Please enable location services.`);
        setIsFetchingLocation(false);
      },
      {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds
          maximumAge: 0 // Don't use cached location
      }
    );
  };

  // --- API Call Logic (Placeholder for Canvas environment) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Login logic is simulated...');
    // Simulating success for preview purposes:
    setTimeout(() => {
        // Clear login fields after simulated login
        setLoginEmail('');
        setLoginPassword('');
        setMessage('Login simulated successfully! You would now be redirected to the dashboard.');
    }, 1000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocationError('');

    if (!latitude || !longitude) {
        setMessage('Please fetch your location using the button before registering.');
        return;
    }

    setMessage('Registration logic is simulated...');
    // Simulating success for preview purposes:
    setTimeout(() => {
        // Clear registration form after simulated registration
        setRegisterEmail('');
        setRegisterPassword('');
        setLatitude('');
        setLongitude('');
        setVendorProfile({ firstName: '', lastName: '', address: '', pincode: '', phoneNumber: '', foodType: '' });
        setSupplierProfile({ companyName: '', warehouseAddress: '', pincode: '', contactPerson: '', gstId: '', deliveryVehicles: '', minOrderValue: '' });
        setMessage('Registration simulated successfully! You would now be redirected to the dashboard.');
        setIsRegister(false); // Optional: switch back to login
    }, 1500);
  };

  // Helper component for input fields
  const FormInput = ({ label, name, value, onChange, type = 'text', required = true, maxLength, step }) => (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
        step={step}
        className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 transition duration-150"
      />
    </div>
  );

  // --- JSX (HTML Structure) ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 font-inter">
      
      {/* Header Card */}
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-6 sm:p-8 mb-6 border-t-4 border-amber-500">
        <div className="flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            <h1 className="text-3xl font-bold text-gray-800">Supply Setu</h1>
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">Connecting trusted suppliers directly to street food vendors.</p>
      </div>

      {/* Main Form Card */}
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-6 sm:p-8">

        {/* Messaging Area */}
        {message && (
          <div className={`p-3 mb-4 rounded-lg text-sm font-medium ${message.includes('success') || message.includes('fetched') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {message}
          </div>
        )}
        {locationError && (
          <div className="p-3 mb-4 rounded-lg text-sm font-medium bg-red-100 text-red-700">
            {locationError}
          </div>
        )}

        {/* Toggle Buttons */}
        <div className="flex justify-center border-b border-gray-200 mb-6">
          <button
            onClick={() => { setIsRegister(false); setMessage(''); setLocationError(''); }}
            className={`flex-1 py-3 text-lg font-semibold transition duration-200 ${!isRegister ? 'text-green-600 border-b-4 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsRegister(true); setMessage(''); setLocationError(''); }}
            className={`flex-1 py-3 text-lg font-semibold transition duration-200 ${isRegister ? 'text-green-600 border-b-4 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Register
          </button>
        </div>

        {/* --- LOGIN FORM --- */}
        {!isRegister ? (
          <form onSubmit={handleLogin}>
            <FormInput label="Email" name="loginEmail" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} type="email" />
            <FormInput label="Password" name="loginPassword" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} type="password" />
            
            <button
              type="submit"
              className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition duration-200 shadow-md"
            >
              Secure Login
            </button>
          </form>
        ) : (

        /* --- REGISTRATION FORM --- */
        <form onSubmit={handleRegister}>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Join as:</h2>
          
          {/* Role Selector */}
          <div className="flex space-x-6 mb-6">
            <label className={`flex items-center p-3 rounded-lg cursor-pointer transition duration-150 ${role === 'VENDOR' ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <input type="radio" value="VENDOR" checked={role === 'VENDOR'} onChange={(e) => setRole(e.target.value)} className="form-radio text-amber-500 h-4 w-4" />
              <span className="ml-2 font-medium text-gray-700">Street Food Vendor</span>
            </label>
            <label className={`flex items-center p-3 rounded-lg cursor-pointer transition duration-150 ${role === 'SUPPLIER' ? 'bg-green-100 ring-2 ring-green-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
              <input type="radio" value="SUPPLIER" checked={role === 'SUPPLIER'} onChange={(e) => setRole(e.target.value)} className="form-radio text-green-500 h-4 w-4" />
              <span className="ml-2 font-medium text-gray-700">Raw Material Supplier</span>
            </label>
          </div>

          <hr className="my-4 border-gray-200" />

          {/* Common Fields */}
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Account Details</h3>
          <FormInput label="Email" name="registerEmail" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} type="email" />
          <FormInput label="Password" name="registerPassword" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} type="password" />

          {/* Location Section - CRITICAL for problem solution */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
            <label className="block text-sm font-bold text-blue-700 mb-2">
                Verify Location (Required)
            </label>
            <p className='text-xs text-blue-600 mb-3'>
                This ties you directly to local delivery routes for efficiency and trust.
            </p>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isFetchingLocation}
              className={`w-full py-2 px-4 rounded-xl font-semibold transition duration-200 ${isFetchingLocation ? 'bg-blue-300 text-blue-800 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
            >
              {isFetchingLocation ? 'Fetching Location...' : 'Use My Current Location'}
            </button>
            {latitude && longitude && (
              <p className="mt-3 text-sm font-medium text-green-600 text-center">
                Location Confirmed! <span className='font-mono text-xs'>(Lat: {latitude.toFixed(4)}, Lon: {longitude.toFixed(4)})</span>
              </p>
            )}
            {!latitude && !isFetchingLocation && <p className='mt-2 text-xs text-blue-600 text-center'>Click above to confirm your physical address.</p>}
          </div>

          {/* Vendor-Specific Fields */}
          {role === 'VENDOR' && (
            <>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 border-t pt-4">Vendor Profile (The Street Food Artist)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="First Name" name="firstName" value={vendorProfile.firstName} onChange={handleVendorChange} />
                <FormInput label="Last Name" name="lastName" value={vendorProfile.lastName} onChange={handleVendorChange} />
              </div>
              <FormInput label="Stall/Cart Address" name="address" value={vendorProfile.address} onChange={handleVendorChange} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Pincode" name="pincode" value={vendorProfile.pincode} onChange={handleVendorChange} maxLength={6} />
                <FormInput label="Phone Number" name="phoneNumber" value={vendorProfile.phoneNumber} onChange={handleVendorChange} type="tel" />
              </div>
              <FormInput label="Food Type (e.g., Chaat, Dosa)" name="foodType" value={vendorProfile.foodType} onChange={handleVendorChange} />
            </>
          )}

          {/* Supplier-Specific Fields */}
          {role === 'SUPPLIER' && (
            <>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 border-t pt-4">Supplier Profile (The Trusted Source)</h3>
              <FormInput label="Company Name" name="companyName" value={supplierProfile.companyName} onChange={handleSupplierChange} />
              <FormInput label="Warehouse Address" name="warehouseAddress" value={supplierProfile.warehouseAddress} onChange={handleSupplierChange} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="Pincode" name="pincode" value={supplierProfile.pincode} onChange={handleSupplierChange} maxLength={6} />
                <FormInput label="Contact Person" name="contactPerson" value={supplierProfile.contactPerson} onChange={handleSupplierChange} />
              </div>
              <FormInput label="GST ID (For Verification/Digital Proof)" name="gstId" value={supplierProfile.gstId} onChange={handleSupplierChange} />
              <FormInput label="Delivery Vehicles (Comma-separated list)" name="deliveryVehicles" value={supplierProfile.deliveryVehicles} onChange={handleSupplierChange} required={false} />
              <FormInput label="Minimum Order Value (₹)" name="minOrderValue" value={supplierProfile.minOrderValue} onChange={handleSupplierChange} type="number" step="0.01" />
            </>
          )}

          <button
            type="submit"
            className="w-full mt-8 bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition duration-200 shadow-lg disabled:bg-gray-400"
            disabled={!latitude || isFetchingLocation}
          >
            Create Account & Get Started
          </button>
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            By registering, you agree to transparent pricing and verified supply chains.
          </p>
        </form>
        )}
      </div>
    </div>
  );
}

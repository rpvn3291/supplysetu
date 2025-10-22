// filename: app/login/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter(); // Hook for navigation
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

  // --- UPDATED: Latitude/Longitude state (no longer direct inputs) ---
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

  // --- NEW: Function to get current location ---
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
        setLocationError(`Error getting location: ${error.message}. Please ensure location services are enabled.`);
        setIsFetchingLocation(false);
      },
      { // Options for better accuracy
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds
          maximumAge: 0 // Don't use cached location
      }
    );
  };

  // --- API Call Logic ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Logging in...');
    setLocationError(''); // Clear location errors on login attempt
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      localStorage.setItem('authToken', data.token);
      setMessage(`Login successful! Welcome ${data.user.email}. Redirecting...`);
      router.push('/'); // Navigate to home page on success
    } catch (error) {
      setMessage(`Login failed: ${error.message}`);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocationError(''); // Clear location errors on register attempt

    // --- UPDATED: Check if location has been fetched ---
    if (!latitude || !longitude) {
        setMessage('Please fetch your location using the button before registering.');
        return;
    }

    setMessage('Registering...');
    let profileData;
    if (role === 'VENDOR') {
      profileData = { ...vendorProfile, latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
      // Simple parsing for operating hours - Consider a dedicated input later
      profileData.operatingHours = { "default": "9am-10pm" };
    } else { // SUPPLIER
      profileData = {
        ...supplierProfile,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        // Ensure deliveryVehicles is treated as a string before splitting
        deliveryVehicles: typeof supplierProfile.deliveryVehicles === 'string'
                          ? supplierProfile.deliveryVehicles.split(',').map(v => v.trim())
                          : [],
        minOrderValue: parseFloat(supplierProfile.minOrderValue) || 0 // Default to 0 if parsing fails
      };
    }

    const registrationData = { email: registerEmail, password: registerPassword, role, profileData };

    try {
       const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('authToken', data.token);
      setMessage('Registration successful! Redirecting...');
      router.push('/'); // Navigate to home page on success
    } catch (error) {
        setMessage(`Registration failed: ${error.message}`);
    }
  };

  // --- JSX (HTML Structure) ---
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', maxWidth: '600px', margin: 'auto' }}>
      <h1>Street Food Supplier Hub</h1>
      {message && <p style={{ color: 'blue' }}>{message}</p>}
      {locationError && <p style={{ color: 'red' }}>{locationError}</p>}

      {/* Toggle between Login and Register views */}
      <div>
        <button onClick={() => { setIsRegister(false); setMessage(''); setLocationError(''); }} disabled={!isRegister} style={{ padding: '8px 12px', marginRight: '10px' }}>Login</button>
        <button onClick={() => { setIsRegister(true); setMessage(''); setLocationError(''); }} disabled={isRegister} style={{ padding: '8px 12px' }}>Register</button>
      </div>
      <hr style={{ margin: '20px 0' }}/>

      {/* --- LOGIN FORM (Conditional) --- */}
      {!isRegister ? (
        <form onSubmit={handleLogin}>
          <h2>Login</h2>
          <div style={{ marginBottom: '15px' }}>
            <label>Email:</label><br />
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Password:</label><br />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/>
          </div>
          <button type="submit" style={{ padding: '10px 15px' }}>Login</button>
        </form>
      ) : (

      /* --- REGISTRATION FORM (Conditional) --- */
      <form onSubmit={handleRegister}>
        <h2>Register</h2>
        {/* Role Selector */}
        <div style={{ marginBottom: '15px' }}>
          <label><input type="radio" value="VENDOR" checked={role === 'VENDOR'} onChange={(e) => setRole(e.target.value)} /> I am a Vendor</label>
          <label style={{marginLeft: '20px'}}><input type="radio" value="SUPPLIER" checked={role === 'SUPPLIER'} onChange={(e) => setRole(e.target.value)} /> I am a Supplier</label>
        </div>
        <hr style={{ margin: '15px 0' }}/>

        {/* Common Fields */}
        <div style={{ marginBottom: '15px' }}><label>Email:</label><br /><input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
        <div style={{ marginBottom: '15px' }}><label>Password:</label><br /><input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>

        {/* --- UPDATED: Location Section --- */}
        <div style={{ marginBottom: '15px' }}>
          <label>Location:</label><br />
          <button type="button" onClick={handleGetCurrentLocation} disabled={isFetchingLocation} style={{ padding: '8px 12px', marginTop: '5px' }}>
            {isFetchingLocation ? 'Fetching Location...' : 'Use My Current Location'}
          </button>
          {latitude && longitude && (
            <p style={{ marginTop: '5px', color: 'green' }}>Fetched: Lat {latitude.toFixed(4)}, Lon {longitude.toFixed(4)}</p>
          )}
        </div>

        {/* Vendor-Specific Fields */}
        {role === 'VENDOR' && (
          <>
            <hr style={{ margin: '15px 0' }}/><h3>Vendor Profile</h3>
            <div style={{ marginBottom: '15px' }}><label>First Name:</label><br /><input name="firstName" value={vendorProfile.firstName} onChange={handleVendorChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
            <div style={{ marginBottom: '15px' }}><label>Last Name:</label><br /><input name="lastName" value={vendorProfile.lastName} onChange={handleVendorChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
            <div style={{ marginBottom: '15px' }}><label>Address:</label><br /><input name="address" value={vendorProfile.address} onChange={handleVendorChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
            <div style={{ marginBottom: '15px' }}><label>Pincode:</label><br /><input name="pincode" value={vendorProfile.pincode} onChange={handleVendorChange} required maxLength={6} style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
            <div style={{ marginBottom: '15px' }}><label>Phone Number:</label><br /><input name="phoneNumber" value={vendorProfile.phoneNumber} onChange={handleVendorChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
            <div style={{ marginBottom: '15px' }}><label>Food Type (e.g., Chaat):</label><br /><input name="foodType" value={vendorProfile.foodType} onChange={handleVendorChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
          </>
        )}

        {/* Supplier-Specific Fields */}
        {role === 'SUPPLIER' && (
          <>
            <hr style={{ margin: '15px 0' }}/><h3>Supplier Profile</h3>
            <div style={{ marginBottom: '15px' }}><label>Company Name:</label><br /><input name="companyName" value={supplierProfile.companyName} onChange={handleSupplierChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
            <div style={{ marginBottom: '15px' }}><label>Warehouse Address:</label><br /><input name="warehouseAddress" value={supplierProfile.warehouseAddress} onChange={handleSupplierChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
            <div style={{ marginBottom: '15px' }}><label>Pincode:</label><br /><input name="pincode" value={supplierProfile.pincode} onChange={handleSupplierChange} required maxLength={6} style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
            <div style={{ marginBottom: '15px' }}><label>Contact Person:</label><br /><input name="contactPerson" value={supplierProfile.contactPerson} onChange={handleSupplierChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
            <div style={{ marginBottom: '15px' }}><label>GST ID:</label><br /><input name="gstId" value={supplierProfile.gstId} onChange={handleSupplierChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
            <div style={{ marginBottom: '15px' }}><label>Delivery Vehicles (comma-separated):</label><br /><input name="deliveryVehicles" value={supplierProfile.deliveryVehicles} onChange={handleSupplierChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
            <div style={{ marginBottom: '15px' }}><label>Minimum Order Value:</label><br /><input type="number" step="0.01" name="minOrderValue" value={supplierProfile.minOrderValue} onChange={handleSupplierChange} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}/></div>
          </>
        )}

        <br/>
        <button type="submit" style={{ padding: '10px 15px' }}>Register</button>
      </form>
      )}
    </div>
  );
}


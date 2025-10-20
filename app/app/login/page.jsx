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
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

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


  // --- API Call Logic ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Logging in...');
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
    setMessage('Registering...');
    
    let profileData;
    if (role === 'VENDOR') {
      profileData = { ...vendorProfile, latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
      // Simple parsing for operating hours
      profileData.operatingHours = { "default": "9am-10pm" }; 
    } else { // SUPPLIER
      profileData = { 
        ...supplierProfile, 
        latitude: parseFloat(latitude), 
        longitude: parseFloat(longitude),
        deliveryVehicles: supplierProfile.deliveryVehicles.split(',').map(v => v.trim()),
        minOrderValue: parseFloat(supplierProfile.minOrderValue)
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
      
      {/* Toggle between Login and Register views */}
      <div>
        <button onClick={() => setIsRegister(false)} disabled={!isRegister}>Login</button>
        <button onClick={() => setIsRegister(true)} disabled={isRegister}>Register</button>
      </div>
      <hr />

      {/* --- LOGIN FORM (Conditional) --- */}
      {!isRegister ? (
        <form onSubmit={handleLogin}>
          <h2>Login</h2>
          <div>
            <label>Email:</label><br />
            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
          </div><br />
          <div>
            <label>Password:</label><br />
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
          </div><br />
          <button type="submit">Login</button>
        </form>
      ) : (
      
      /* --- REGISTRATION FORM (Conditional) --- */
      <form onSubmit={handleRegister}>
        <h2>Register</h2>
        {/* Role Selector */}
        <div>
          <label><input type="radio" value="VENDOR" checked={role === 'VENDOR'} onChange={(e) => setRole(e.target.value)} /> I am a Vendor</label>
          <label style={{marginLeft: '20px'}}><input type="radio" value="SUPPLIER" checked={role === 'SUPPLIER'} onChange={(e) => setRole(e.target.value)} /> I am a Supplier</label>
        </div>
        <hr/>
        
        {/* Common Fields */}
        <div><label>Email:</label><br /><input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required /></div><br/>
        <div><label>Password:</label><br /><input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required /></div><br/>
        <div><label>Latitude:</label><br /><input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} required /></div><br/>
        <div><label>Longitude:</label><br /><input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} required /></div><br/>

        {/* Vendor-Specific Fields */}
        {role === 'VENDOR' && (
          <>
            <hr/><h3>Vendor Profile</h3>
            <div><label>First Name:</label><br /><input name="firstName" value={vendorProfile.firstName} onChange={handleVendorChange} required /></div><br/>
            <div><label>Last Name:</label><br /><input name="lastName" value={vendorProfile.lastName} onChange={handleVendorChange} required /></div><br/>
            <div><label>Address:</label><br /><input name="address" value={vendorProfile.address} onChange={handleVendorChange} required /></div><br/>
            <div><label>Pincode:</label><br /><input name="pincode" value={vendorProfile.pincode} onChange={handleVendorChange} required maxLength={6} /></div><br/>
            <div><label>Phone Number:</label><br /><input name="phoneNumber" value={vendorProfile.phoneNumber} onChange={handleVendorChange} required /></div><br/>
            <div><label>Food Type (e.g., Chaat):</label><br /><input name="foodType" value={vendorProfile.foodType} onChange={handleVendorChange} required /></div><br/>
          </>
        )}

        {/* Supplier-Specific Fields */}
        {role === 'SUPPLIER' && (
          <>
            <hr/><h3>Supplier Profile</h3>
            <div><label>Company Name:</label><br /><input name="companyName" value={supplierProfile.companyName} onChange={handleSupplierChange} required /></div><br/>
            <div><label>Warehouse Address:</label><br /><input name="warehouseAddress" value={supplierProfile.warehouseAddress} onChange={handleSupplierChange} required /></div><br/>
            <div><label>Pincode:</label><br /><input name="pincode" value={supplierProfile.pincode} onChange={handleSupplierChange} required maxLength={6} /></div><br/>
            <div><label>Contact Person:</label><br /><input name="contactPerson" value={supplierProfile.contactPerson} onChange={handleSupplierChange} required /></div><br/>
            <div><label>GST ID:</label><br /><input name="gstId" value={supplierProfile.gstId} onChange={handleSupplierChange} required /></div><br/>
            <div><label>Delivery Vehicles (comma-separated):</label><br /><input name="deliveryVehicles" value={supplierProfile.deliveryVehicles} onChange={handleSupplierChange} required /></div><br/>
            <div><label>Minimum Order Value:</label><br /><input type="number" name="minOrderValue" value={supplierProfile.minOrderValue} onChange={handleSupplierChange} required /></div><br/>
          </>
        )}
        
        <br/>
        <button type="submit">Register</button>
      </form>
      )}
    </div>
  );
}


// This is a client component because it handles user input and state.
'use client'; 

import { useState } from 'react';

export default function LoginPage() {
  // State for the login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // State for the register form
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // State to show messages to the user
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Logging in...');

    try {
      // Calls the internal Next.js API route, not the microservice directly.
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }
      
      // In a real app, you would save this token securely (e.g., in an httpOnly cookie)
      localStorage.setItem('authToken', data.token);
      setMessage(`Login successful! Welcome ${data.user.email}`);
      console.log('Login successful! Token:', data.token);

    } catch (error) {
      setMessage(`Login failed: ${error.message}`);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('Registering...');

    // This is hardcoded for a VENDOR for simplicity.
    const registrationData = {
      email: registerEmail,
      password: registerPassword,
      role: 'VENDOR',
      profileData: {
        firstName: 'New',
        lastName: 'Vendor',
        address: '123 Test Street',
        pincode: '123456',
        phoneNumber: '9876543210'
      }
    };

    try {
       // Calls the internal Next.js API route.
       const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to register');
      }
      
      setMessage('Registration successful! Please log in.');
      console.log('Registration successful!', data);

    } catch (error) {
        setMessage(`Registration failed: ${error.message}`);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Street Food Supplier Hub</h1>
      {message && <p style={{ color: 'blue' }}>{message}</p>}
      <hr />
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label><br />
          {/* FIX: Changed e.to.value to e.target.value */}
          <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
        </div>
        <br />
        <div>
          <label>Password:</label><br />
          <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
        </div>
        <br />
        <button type="submit">Login</button>
      </form>
      <hr />
      <h2>Register as a Vendor</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label>Email:</label><br />
          <input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required />
        </div>
        <br />
        <div>
          <label>Password:</label><br />
          <input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required />
        </div>
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}


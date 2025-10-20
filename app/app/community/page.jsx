// filename: app/community/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinCommunityPage() {
  const [pincode, setPincode] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pincode.trim()) {
      router.push(`/community/${pincode}`);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Join a Pincode Community</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          placeholder="Enter your 6-digit pincode"
          maxLength={6}
          required
        />
        <button type="submit">Join Chat</button>
      </form>
    </div>
  );
}

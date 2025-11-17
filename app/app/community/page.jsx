// filename: app/community/page.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- Users/Community Icon (Inline SVG) ---
const CommunityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-2.37M17 20H7a2 2 0 01-2-2v-2a2 2 0 012-2h4a2 2 0 002-2V4a2 2 0 012-2h4a2 2 0 012 2v2M9 12A3 3 0 109 6a3 3 0 000 6z" />
    </svg>
);
// --- End Icon ---

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
    // Fullscreen background
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-inter">
       {/* Card Container */}
       <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl p-8 border-t-4 border-purple-500">
            
            {/* Icon */}
            <div className="mx-auto w-14 h-14 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-5">
                <CommunityIcon />
            </div>

            {/* Header */}
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
                Join a Community
            </h1>
            <p className="text-center text-gray-500 mb-8">
                Enter your 6-digit pincode to join the chat for your local area.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">
                        Pincode
                    </label>
                    <input
                        type="text"
                        id="pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} // Only allow digits
                        placeholder="Enter your 6-digit pincode"
                        maxLength={6}
                        required
                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-150"
                        pattern="\d{6}" // HTML5 validation for 6 digits
                        title="Pincode must be exactly 6 digits."
                    />
                </div>
                
                <button 
                    type="submit"
                    className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                >
                    Join Chat
                </button>
            </form>

             {/* Footer Link */}
            <div className="text-center mt-6">
                 <Link href="/" className="text-sm text-blue-600 hover:underline">
                    &larr; Back to Home
                 </Link>
            </div>
       </div>
    </div>
  );
}
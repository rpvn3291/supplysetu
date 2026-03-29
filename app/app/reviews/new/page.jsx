'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ReviewForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderId = searchParams.get('orderId');
  const supplierId = searchParams.get('supplierId');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // If orderId or supplierId is missing, show an error.
  if (!orderId || !supplierId) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500 mb-4">Invalid request. Order ID and Supplier ID are required.</p>
        <Link href="/my-orders" className="text-blue-600 hover:underline">&larr; Back to My Orders</Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      setError('You must be logged in to submit a review.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUserId: supplierId,
          orderId,
          rating: Number(rating),
          comment
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      setSuccess(true);
      // Wait a bit, then redirect to my-orders
      setTimeout(() => {
        router.push('/my-orders');
      }, 3000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center mt-10 bg-green-50 p-8 rounded-lg border border-green-200 shadow-sm max-w-md mx-auto">
        <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Review Submitted!</h2>
        <p className="text-green-700 mb-4">Your review is being saved securely to the blockchain.</p>
        <p className="text-sm text-gray-500">Redirecting to your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200 w-full mb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Write a Review</h1>
      
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`text-3xl focus:outline-none transition-colors ${rating >= star ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-gray-400'}`}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-500">({rating}/5)</span>
          </div>
        </div>
        
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Comment (Optional)</label>
          <textarea
            id="comment"
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400"
            placeholder="Tell us about your experience with this product and supplier..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <Link href="/my-orders" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewReviewPage() {
  return (
    <div className="min-h-screen bg-gray-100 font-inter p-4 sm:p-8 flex items-center justify-center">
      <Suspense fallback={<div className="text-gray-500">Loading form...</div>}>
         <ReviewForm />
      </Suspense>
    </div>
  );
}

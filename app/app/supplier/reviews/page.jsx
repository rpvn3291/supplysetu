'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SupplierReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supplierId, setSupplierId] = useState(null);

  useEffect(() => {
    // Decode user info from token
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setSupplierId(payload.id);
      } catch (e) {
        console.error("Token parse error", e);
      }
    }
  }, []);

  useEffect(() => {
    if (!supplierId) return;

    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/reviews/user/${supplierId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const data = await response.json();
        setReviews(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [supplierId]);

  if (!supplierId) {
    return (
      <div className="p-4 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Reviews</h1>
        <p className="text-gray-500">Please log in to view your reviews.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">My Reviews</h1>
      
      {loading && <p className="text-gray-500">Loading your reviews...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="mb-6 pb-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Overall Rating</h2>
              <p className="text-gray-500 text-sm">Based on {reviews.length} reviews</p>
            </div>
            <div className="text-3xl font-bold text-yellow-500 flex items-center">
               {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 'N/A'}
               <span className="text-xl ml-1">★</span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">You haven't received any reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id || review.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex text-yellow-400 text-sm mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                           <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 font-medium">Order: #{review.orderId?.substring(0,8)}</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment ? (
                    <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic mt-2">No comment provided.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

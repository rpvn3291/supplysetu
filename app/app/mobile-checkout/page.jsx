'use client';

import { useEffect, useState, Suspense } from 'react';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState(null);

  const amount = searchParams.get('amount');
  const token = searchParams.get('token');
  const orderDataParam = searchParams.get('orderData');

  useEffect(() => {
    if (!amount || !token || !orderDataParam) {
      setError('Missing payment parameters.');
      return;
    }

    let orderData;
    try {
      orderData = JSON.parse(decodeURIComponent(orderDataParam));
    } catch (e) {
      setError('Invalid order payload.');
      return;
    }

    const startPayment = async () => {
      try {
        setStatus('Generating secure payment intent...');
        // 1. Create order intent
        const rzpResponse = await fetch('/api/orders/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ amount: parseFloat(amount) })
        });

        if (!rzpResponse.ok) throw new Error('Payment initialization failed.');
        const orderOptions = await rzpResponse.json();

        setStatus('Waiting for payment completion...');

        const rzpOptions = {
          key: 'rzp_test_SUNfXUR78kYFBd',
          amount: orderOptions.amount,
          currency: orderOptions.currency,
          name: "SupplySetu Vendor App",
          description: "Mobile Order Payment",
          order_id: orderOptions.id,
          handler: async function (response) {
            setStatus('Payment successful. Verifying signature...');
            try {
              const verifyRes = await fetch('/api/orders/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });

              if (!verifyRes.ok) throw new Error("Payment signature verification failed!");

              setStatus('Signature verified. Creating SupplySetu order...');
              const createOrderRes = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(orderData)
              });

              if (!createOrderRes.ok) throw new Error("Failed to create the final order.");
              
              const newOrder = await createOrderRes.json();
              setStatus('Order Finalized Successfully! You can now close this browser window to return to the Vendor App.');
            } catch (err) {
              setError(err.message);
            }
          },
          theme: { color: "#16a34a" }
        };

        const rzp = new window.Razorpay(rzpOptions);
        rzp.on('payment.failed', function (response){
          setError(`Payment failed: ${response.error.description}`);
        });
        rzp.open();

      } catch (err) {
        setError(err.message);
      }
    };

    // Small delay to ensure Razorpay script mounts
    setTimeout(startPayment, 1000);
  }, [amount, token, orderDataParam]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Secure Checkout</h1>
        {error ? (
          <div>
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <p className="text-sm text-gray-500">Please close this window and try again.</p>
          </div>
        ) : status.includes('Successfully') ? (
          <div>
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <p className="text-green-700 font-bold text-lg mb-2">{status}</p>
            <p className="text-sm text-gray-500 mt-4">You can now safely tap "Done" or close this browser window to return to the app.</p>
          </div>
        ) : (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MobileCheckout() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

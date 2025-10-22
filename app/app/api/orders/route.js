// filename: app/api/orders/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    // Get the original order data sent from the frontend
    const originalOrderData = await request.json();
    const { vendorLocationLat, vendorLocationLon } = originalOrderData;

    // --- Fetch live weather data ---
    let weatherData = {}; // Default to empty object if fetch fails
    try {
      // Ensure lat/lon are present before fetching weather
      if (vendorLocationLat != null && vendorLocationLon != null) {
        const weatherApiKey = process.env.WEATHER_API_KEY;
        if (!weatherApiKey) throw new Error("Weather API Key not configured.");
        
        const weatherResponse = await fetch(
          `http://api.weatherapi.com/v1/current.json?key=${weatherApiKey}&q=${vendorLocationLat},${vendorLocationLon}`
        );
        
        if (weatherResponse.ok) {
          const data = await weatherResponse.json();
          weatherData = {
            temp: data.current.temp_c,
            condition: data.current.condition.text,
            is_day: data.current.is_day,
          };
        } else {
            console.warn(`Weather API request failed: ${weatherResponse.status}`);
        }
      } else {
          console.warn("Vendor location missing, cannot fetch weather.");
      }
    } catch (weatherError) {
      console.error("Could not fetch weather:", weatherError);
    }

    // --- THIS IS THE FIX ---
    // Combine the original order data with the fetched weather data
    const completeOrderData = {
      ...originalOrderData, // Include all fields sent by the frontend
      weatherAtOrder: weatherData, // Add/overwrite the weather data
    };
    // --- END OF FIX ---


    // Forward the COMPLETE request data to your deployed Order microservice
    const apiResponse = await fetch(`${process.env.ORDER_API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(completeOrderData), // Send the combined data
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      // Log the specific error message from the order service for debugging
      console.error("Order service failed:", data); 
      return NextResponse.json({ message: data.message || 'Failed to create order' }, { status: apiResponse.status });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('API Gateway create order error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


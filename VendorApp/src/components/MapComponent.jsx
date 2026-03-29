import React from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';

const MapComponent = ({ style, initialRegion, region, driverLocation, vendorLocation, routeCoordinates }) => {
  return (
    <MapView
      style={style}
      initialRegion={initialRegion}
      region={region}
    >
      {driverLocation && (
        <Marker
          coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lon }}
          title="Delivery Driver"
          description="Driver in transit"
          pinColor="blue"
        />
      )}
      {vendorLocation && (
        <>
          <Marker
            coordinate={{ latitude: vendorLocation.lat, longitude: vendorLocation.lon }}
            title="Destination"
            description="Your Shop"
            pinColor="green"
          />
          {driverLocation && (
            <Polyline
              coordinates={routeCoordinates.length > 0 ? routeCoordinates : [
                { latitude: driverLocation.lat, longitude: driverLocation.lon },
                { latitude: vendorLocation.lat, longitude: vendorLocation.lon }
              ]}
              strokeColor="#3b82f6" // blue
              strokeWidth={4}
              lineDashPattern={routeCoordinates.length > 0 ? null : [5, 5]}
            />
          )}
        </>
      )}
    </MapView>
  );
};

export default MapComponent;

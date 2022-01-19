import logo from './logo.svg';
import './App.css';

import React from 'react'
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';

function App() {

  const containerStyle = {
    width: '100vw',
    height: '100vh'
  };

  const [center, setCenter] = React.useState({
    lat: -33.868820,
    lng: 151.209290
  });
  
  const libraries = ['places']

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_KEY,
    libraries,
  });

  const [markers, setMarkers] = React.useState([])
  const [selected, setSelected] = React.useState(null)

  const onMapClick = React.useCallback((e) => {
    setMarkers(currentMarkers => [...currentMarkers, {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    }])
  }, []);

  const mapRef = React.useRef();




  if (loadError) return "Error loading google maps"
  if (!isLoaded) return "Loading google maps..."

  
  return (
    <div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        zoom={10}
        center={center}
        onClick={(e) => onMapClick(e)}
      >
        {markers.map((marker, index) => 
          <Marker
            position={{lat: marker.lat, lng: marker.lng}}
            key={index}
            onClick={() => setSelected(marker)}
          />
        )}
        {selected ? (<InfoWindow
          position={selected}
          onCloseClick={() => setSelected(null)}
        >
          <p>This is a location</p>
        </InfoWindow>) : null
        }
        
      </GoogleMap>
    </div>
  
  );
}

export default App;

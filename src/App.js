import logo from './logo.svg';

import React from 'react'
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';


import Autocomplete from './components/Autocomplete';

function App() {

  const mapContainerStyle = {
    width: '100%',
    height: '100vh',
    flex: '3'
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
  const [currMarker, setCurrMarker] = React.useState(null)
  const [parks, setParks] = React.useState([])

  const onMapClick = React.useCallback((e) => {
    setCurrMarker({
      address: null,
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    })
    console.log({
      address: null,
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    })
  }, []);

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map
  }, []);

  if (loadError) return "Error loading google maps"
  if (!isLoaded) return "Loading google maps..."

  const panMap = ( {address, lat, lng} ) => {
    mapRef.current.panTo({lat, lng});
    mapRef.current.setZoom(16);
    // console.log({address, lat, lng})
    setCurrMarker({address, lat, lng})
  }

  const confirmMarker = () => {
    setMarkers([...markers, currMarker])
    setCurrMarker(null);
  }

  // -33.9488651, 151.0494066
  // React.useEffect(() => {
  //   fetch('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=-33.9488651,151.0494066&radius=500&type=park&key=' + process.env.REACT_APP_GOOGLE_KEY)
  //   .then(response => response.json())
  //   .then(data => console.log(data));
  // }, []);



  // React.useEffect(() => {
  //   fetch('https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=-33.9488651,151.0494066&radius=500&type=park&key=' + process.env.REACT_APP_GOOGLE_KEY)
  //   .then(response => response.json())
  //   .then(data => {
  //     console.log(data.results);
  //     // data.map((foundPark) => setParks([...parks, {latlng: foundPark.location}]))
  //     setParks(data.results);
  //   })
  //   .catch(error => console.log(error));
  // }, [parks]);

  const findParks = () => {
    fetch('https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=-33.9488651,151.0494066&radius=1000&type=park&key=' + process.env.REACT_APP_GOOGLE_KEY)
    .then(response => response.json())
    .then(data => {
      console.log(data.results);
      setParks(data.results)
      // setParks(data.results);
    })
    .catch(error => console.log(error));
  }

  return (
    <div style={{display : 'flex'}}>
      <div style={{flex : '3'}}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={10}
          center={center}
          onClick={(e) => onMapClick(e)}
          onLoad={onMapLoad}
          options={{
            disableDoubleClickZoom: 'true',
            clickableIcons : false
          }}
        >
          {currMarker ? (<Marker
            position={{lat: currMarker.lat, lng: currMarker.lng}}
            opacity={0.5}
            onClick={confirmMarker}
          />) : null}
          {markers.map((marker, index) => 
            <Marker
              position={{lat: marker.lat, lng: marker.lng}}            
              key={index}
              onClick={() => setSelected(marker)}
            />
          )}
          {parks.map((park, index) => 
            <Marker
              position={{lat: park.geometry.location.lat, lng: park.geometry.location.lng}}            
              key={index}
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
      <div style={{display: 'flex', flexDirection: 'column', flex: '1', alignItems: 'center', padding: '10px'}}>
        <Autocomplete panMap={panMap}/>
        {markers.map((marker) => 
          marker.address ? <h5>{marker.address}</h5> : <h5>{marker.lat},{marker.lng}</h5>
        )}
      <button
        style={{width: '100px', height: '50px'}}
        onClick={findParks}
      >
        Find Parks
      </button>
      {parks ? parks.map((park) => <h5 style={{margin:'0'}}>{park.name}</h5>) : null}
      </div>
    </div>
  
  );
}

export default App;

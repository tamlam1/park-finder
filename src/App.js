import React from 'react'
import { GoogleMap, useLoadScript, Marker, InfoWindow, Circle} from '@react-google-maps/api';

import Autocomplete from './components/Autocomplete';

import { computeDistanceBetween } from 'spherical-geometry-js'

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
  
  const libraries = ['places', 'geometry']

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_KEY,
    libraries,
  });

  const [markers, setMarkers] = React.useState([])
  const [selected, setSelected] = React.useState(null)
  const [currMarker, setCurrMarker] = React.useState(null)
  const [parks, setParks] = React.useState([])
  const [nextToken, setNextToken] = React.useState(null) 

  const onMapClick = React.useCallback((e) => {
    setCurrMarker({
      address: null,
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    })
    // console.log({
    //   address: null,
    //   lat: e.latLng.lat(),
    //   lng: e.latLng.lng()
    // })
  }, []);

  const mapRef = React.useRef();
  const onMapLoad = React.useCallback((map) => {
    mapRef.current = map
  }, []);

  const initialRender = React.useRef(true);

  React.useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    if (parks.length === 0) {
      return;
    }

    fetch('https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=' + nextToken + '&key=' + process.env.REACT_APP_GOOGLE_KEY)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        setParks([...parks, ...data.results])
        if (data.next_page_token) {
          setTimeout(setNextToken, 2000, data.next_page_token)
        }
      })
  }, [nextToken])

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

  

  const findParks = () => {
    // console.log(markers.length)
    const home = '-33.9488651,151.0494066'
    const radius = '10000'
    setParks([]);
    for (var count = 0; count < markers.length; count++) {
      // console.log(markers[count]);
      fetch('https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + markers[count].lat + ',' + markers[count].lng + '&radius=' + radius +'&type=park&key=' + process.env.REACT_APP_GOOGLE_KEY)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        setParks([...parks, ...data.results])
        if (data.next_page_token) {
          setTimeout(setNextToken, 2000, data.next_page_token)
        }
      })
      .catch(error => console.log(error));
    }
    
    
    // console.log(computeDistanceBetween(
    //   {
    //     lat: -33.868820,
    //     lng: 151.209290
    //   },
    //   {
    //     lat: -33.9488651,
    //     lng: 151.0494066
    //   }
    // ))
    
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
              label={'P'}
            />
          )}
          {selected ? (<InfoWindow
            position={selected}
            onCloseClick={() => setSelected(null)}
          >
            <p>{selected.lat}, {selected.lng}</p>
          </InfoWindow>) : null
          }
          {markers.map((marker, index) =>
            <Circle
              key={index}
              options={{
                center: {lat: marker.lat, lng: marker.lng},
                radius: 5000,
                clickable: false
              }}
            />
          )}

        </GoogleMap>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', flex: '1', alignItems: 'center', padding: '10px', maxHeight: '95vh'}}>
        <Autocomplete panMap={panMap}/>
        <div>
          {markers.map((marker, index) => 
            marker.address ? <h5 key={index} style={{padding: 'none'}}>{marker.address}</h5> : <h5>{marker.lat},{marker.lng}</h5>
          )}
        </div>
        <button
          onClick={findParks}
        >
          Find Parks
        </button>
        <div style={{overflow: 'auto'}}>
          <p>Parks found: {parks.length}</p>
          {parks.map((park, index) => <h5 key={index} style={{margin:'0'}}>{park.name}</h5>)}
        </div>
      </div>
    </div>
  
  );
}

export default App;

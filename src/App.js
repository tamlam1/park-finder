import React from 'react'
import { GoogleMap, useLoadScript, Marker, InfoWindow, Circle, } from '@react-google-maps/api';

import Autocomplete from './components/Autocomplete';

import { computeDistanceBetween, computeOffset, interpolate } from 'spherical-geometry-js'

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
  const [searchMarker, setSearchMarker] = React.useState(null)
  const [valid, setValid] = React.useState(true)
  const [range, setRange] = React.useState(10000)

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

  const checkInBounds = ( parks ) => {
    var validParks = [];
    for (var count = 0; count < parks.length; count++) {
      var valid = true;
      for (var count1 = 0; count1 < markers.length; count1++) {
        // console.log(computeDistanceBetween({lat: parks[count].geometry.location.lat, lng: parks[count].geometry.location.lng}, {lat: markers[count1].lat, lng: markers[count1].lng}));
        if (computeDistanceBetween({lat: parks[count].geometry.location.lat, lng: parks[count].geometry.location.lng}, {lat: markers[count1].lat, lng: markers[count1].lng}) > range) {
          valid = false;
        }
      }
      if (valid === true) validParks.push(parks[count]);
      valid = false;
    }
    console.log(validParks)
    return validParks
  }

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
        // console.log(data);
        setParks([...parks, ...checkInBounds(data.results)])
        if (data.next_page_token) {
          setTimeout(setNextToken, 2000, data.next_page_token)
        }
      })
      .catch(error => console.log(error));
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

  const checkOverlap = () => {
    for (var count = 0; count < markers.length; count++) {
      for (var count1 = 0; count1 < markers.length; count1++) {
        if (computeDistanceBetween({lat: markers[count].lat, lng: markers[count].lng}, {lat: markers[count1].lat, lng: markers[count1].lng}) > range * 2) {
          return false;
        }
      }
    }
    return true;
  }

  const findParks = () => {
    // console.log(markers.length)
    const home = '-33.9488651,151.0494066'
    const radius = '5000'

    if (!checkOverlap()) {
      setValid(false);
      return;
    } else {
      setValid(true);
    }

    console.log(parks)
    // ======================================================

    // for (var count = 0; count < markers.length; count++) {
    //   // console.log(markers[count]);
    //   fetch('https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + markers[count].lat + ',' + markers[count].lng + '&radius=' + radius +'&type=park&key=' + process.env.REACT_APP_GOOGLE_KEY)
    //   .then(response => response.json())
    //   .then(data => {
    //     console.log(data)
    //     setParks([...parks, ...data.results])
    //     if (data.next_page_token) {
    //       setTimeout(setNextToken, 2000, data.next_page_token)
    //     }
    //   })
    //   .catch(error => console.log(error));
    // }

    // =======================================================
    
    if (markers.length > 1) {
      const upArr = [];
      const downArr = [];
      const leftArr = [];
      const rightArr = [];
      for (var count = 0; count < markers.length; count++) {
        // console.log(markers[count]);
        upArr.push(computeOffset({lat: markers[count].lat, lng: markers[count].lng}, range, 0).latitude);
        downArr.push(computeOffset({lat: markers[count].lat, lng: markers[count].lng}, range, 180).latitude);
        leftArr.push(computeOffset({lat: markers[count].lat, lng: markers[count].lng}, range, 270).longitude);
        rightArr.push(computeOffset({lat: markers[count].lat, lng: markers[count].lng}, range, 90).longitude);
        // const bounds = {'up':up, 'down': down, 'left': left, 'right': right};
        // console.log(bounds)
      }
      const intersection = {
        up: Math.min(...upArr),
        down: Math.max(...downArr),
        left: Math.max(...leftArr),
        right: Math.min(...rightArr)
      }
      // console.log(intersection)
      const intersectionCenter = interpolate({lat: intersection.up, lng: intersection.left }, {lat: intersection.down, lng: intersection.right}, 0.5)
      // console.log(intersectionCenter)
      const intersectionMarker = {address: null, lat: intersectionCenter.latitude, lng: intersectionCenter.longitude}
      // setMarkers([...markers, intersectionMarker])
      setSearchMarker(intersectionMarker)
      
      fetch('https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + intersectionMarker.lat + ',' + intersectionMarker.lng + '&radius=' + radius +'&type=park&key=' + process.env.REACT_APP_GOOGLE_KEY)
      .then(response => response.json())
      .then(data => {
        // console.log(data)
        // console.log(parks)
        setParks([...checkInBounds(data.results)])
        if (data.next_page_token) {
          setTimeout(setNextToken, 2000, data.next_page_token)
        }
      })
      .catch(error => console.log(error));
    } else if (markers.length === 1) {
      fetch('https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + markers[0].lat + ',' + markers[0].lng + '&radius=' + radius +'&type=park&key=' + process.env.REACT_APP_GOOGLE_KEY)
        .then(response => response.json())
        .then(data => {
          // console.log(data)
          setParks([...checkInBounds(data.results)])
          if (data.next_page_token) {
            setTimeout(setNextToken, 2000, data.next_page_token)
          }
        })
        .catch(error => console.log(error));
    }    
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
              zIndex={999}
            />
          )}
          {searchMarker ?
            <Marker
              position={{lat: searchMarker.lat, lng: searchMarker.lng}}            
              icon={'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'}
            /> 
            : null
          }
          {parks.map((park, index) => 
            <Marker
              position={{lat: park.geometry.location.lat, lng: park.geometry.location.lng}}            
              key={index}
              // label={'P'}
              icon={'http://maps.google.com/mapfiles/ms/icons/green-dot.png'}
            />
          )}
          {selected ? (<InfoWindow
            position={{lat: selected.lat, lng: selected.lng}}
            onCloseClick={() => setSelected(null)}
            zIndex={1}
            options={{
              pixelOffset: new window.google.maps.Size(0,-43),
            }}
          >
            <p>{selected.lat}, {selected.lng}</p>
          </InfoWindow>) : null
          }
          {markers.map((marker, index) =>
            <Circle
              key={index}
              options={{
                center: {lat: marker.lat, lng: marker.lng},
                radius: range,
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
        <div>
          Range(m)
          <input
            value={range}
            onChange={(e) => {
              console.log(e.target.value)
              if (Number.isInteger(parseInt(e.target.value))) {
                console.log('lololoololol')
                setRange(parseInt(e.target.value));
              }
            }}
          />
        </div>
        
        <div style={{overflow: 'auto'}}>
          {!valid ? <p style={{color: 'red'}}>Given points not in range of each other</p> : null}
          <p>Parks found: {parks.length}</p>
          {parks.map((park, index) => <h5 key={index} style={{margin:'0'}}>{park.name}</h5>)}
        </div>
      </div>
    </div>
  
  );
}

export default App;

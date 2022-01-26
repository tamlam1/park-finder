import React from 'react'
import { GoogleMap, useLoadScript, Marker, InfoWindow, Circle, } from '@react-google-maps/api';

import Autocomplete from './components/Autocomplete';

import { computeDistanceBetween, computeOffset, interpolate } from 'spherical-geometry-js'

import mapStyles from './mapStyles';

import locateMeIcon from './locate-me-icon.png'

// toggle buttons
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// loading animation
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';

import Tooltip from '@mui/material/Tooltip';

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

  const [markers, setMarkers] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [currMarker, setCurrMarker] = React.useState(null);
  const [parks, setParks] = React.useState([]);
  const [searchMarker, setSearchMarker] = React.useState(null);
  const [valid, setValid] = React.useState(true);
  const [range, setRange] = React.useState(10000);
  const [selectedPark, setSelectedPark] = React.useState(null);
  const [markerType, setMarkerType] = React.useState('red');
  const [blueMarkers, setBlueMarkers] = React.useState([]);
  const [currBlueMarker, setCurrBlueMarker] = React.useState(null);
  const [selectedBlue, setSelectedBlue] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const handleToggle = () => {
    setOpen(!open);
  };

  const onMapClick = (e) => {
    // console.log(markerType);
    if (markerType === 'red') {
      setCurrMarker({
        valid: true,
        address: null,
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    } else {
      setCurrBlueMarker({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
    setSelected(null);
    setSelectedPark(null);
    setSelectedBlue(null);
    if (markerType === 'red') {
      setCurrBlueMarker(null);
    } else {
      setCurrMarker(null);
    }
  };

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
    // console.log(validParks)
    return validParks
  }

  const checkInBoundsBlue = ( blueMarkerArr ) => {
    var validMarker = [];
    for (var count = 0; count < blueMarkerArr.length; count++) {
      var valid = true;
      for (var count1 = 0; count1 < markers.length; count1++) {
        // console.log(computeDistanceBetween({lat: parks[count].geometry.location.lat, lng: parks[count].geometry.location.lng}, {lat: markers[count1].lat, lng: markers[count1].lng}));
        if (computeDistanceBetween({lat: blueMarkerArr[count].lat, lng: blueMarkerArr[count].lng}, {lat: markers[count1].lat, lng: markers[count1].lng}) > range) {
          valid = false;
        }
      }
      if (valid === true) validMarker.push(blueMarkerArr[count]);
      valid = false;
    }
    // console.log(validMarker)
    return validMarker
  }


  if (loadError) return "Error loading google maps"
  if (!isLoaded) return "Loading google maps..."

  const panMap = ( {address, lat, lng} ) => {
    mapRef.current.panTo({lat, lng});
    mapRef.current.setZoom(16);

    // console.log({address, lat, lng})
    // console.log({valid: true, address, lat, lng})
    setCurrMarker({valid: null, address, lat, lng})
  }

  const confirmMarker = () => {
    setMarkers([...markers, currMarker])
    setCurrMarker(null);
  }

  const confirmBlueMarker = () => {
    setBlueMarkers([...blueMarkers, currBlueMarker])
    setCurrBlueMarker(null);
  }

  const locateUser = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current.panTo({lat: position.coords.latitude, lng: position.coords.longitude});
        mapRef.current.setZoom(16);
        setCurrMarker({lat: position.coords.latitude, lng: position.coords.longitude})
        setSelected(null);
        setSelectedPark(null);
      },
      () => null,
    )
  }

  const handleMarkerType = (event, newMarkerType) => {
    if (newMarkerType !== null) {
      setMarkerType(newMarkerType);
    }
  };

  const checkOverlap = () => {
    var invalidPoints = []
    for (var count = 0; count < markers.length; count++) {
      var matches = 0
      for (var count1 = 0; count1 < markers.length; count1++) {
        if (computeDistanceBetween({lat: markers[count].lat, lng: markers[count].lng}, {lat: markers[count1].lat, lng: markers[count1].lng}) <= range * 2) {
          matches++;
        }
      }
      if (matches !== markers.length) {
        invalidPoints.push(markers[count])
      }
    }
    var newMarkers = [...markers]
    for (var count = 0; count < invalidPoints.length; count++) {
      newMarkers = markers.filter((marker) => marker.lat !== invalidPoints[count].lat && marker.lng !== invalidPoints[count].lng);
      newMarkers.push({
        valid: false,
        address: invalidPoints[count].address,
        lat: invalidPoints[count].lat,
        lng: invalidPoints[count].lng
      })
    }
    if (invalidPoints.length > 0) {
      console.log(invalidPoints);
      console.log(newMarkers);
      setMarkers([...newMarkers]);
      return false; 
    } else {
      var validMarkers = [];
      for (var count = 0; count < markers.length; count++) {
        validMarkers.push({
          valid: true,
          address: markers[count].address,
          lat: markers[count].lat,
          lng: markers[count].lng
        })
        setMarkers([...validMarkers]);
      }
      return true;
    }
  }

  const removeMarker = () => {
    var removeArr = markers.filter((marker) => marker.lat !== selected.lat && marker.lng !== selected.lng);
    // console.log(removeArr);
    setMarkers([...removeArr]);
    setSelected(null);
  }

  const removeBlue = () => {
    var removeArr = blueMarkers.filter((marker) => marker.lat !== selectedBlue.lat && marker.lng !== selectedBlue.lng);
    // console.log(removeArr);
    setBlueMarkers([...removeArr]);
    setSelectedBlue(null);
  }

  const removeAllMarkers = () => {
    setMarkers([]);
    setSelected(null);
    setParks([]);
    setSearchMarker(null);
    setBlueMarkers([]);
    setSelectedBlue(null);
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

    if (markers.length !== 0) {
      handleToggle();
    }

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

      console.log('fetching now...')
      const searchArr = [intersectionMarker, ...checkInBoundsBlue(blueMarkers)]
      fetch('/find_parks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({'markers': searchArr, 'radius': range, 'key': process.env.REACT_APP_GOOGLE_KEY})
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setParks(checkInBounds([...data.parks]));
        handleClose();
      })  

    } else if (markers.length === 1) {

      console.log('fetching now...')
      const searchArr = [...markers, ...checkInBoundsBlue(blueMarkers)]
      fetch('/find_parks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({'markers': searchArr, 'radius': range, 'key': process.env.REACT_APP_GOOGLE_KEY})
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setParks(checkInBounds([...data.parks]));
        handleClose();
      })

    }
  }

  return (
    <div style={{display : 'flex'}}>
      <div style={{display: 'flex', flexDirection: 'column', flex: '1', alignItems: 'center', padding: '10px', maxHeight: '95vh', maxWidth: '300px'}}>
        
        <div style={{overflow: 'auto', width: '95%', height: '40vh'}}>
          {markers.map((marker, index) => 
            marker.address ? 
              <h5
                key={index}
                onClick={() => {
                  mapRef.current.panTo({lat: marker.lat, lng: marker.lng});
                  setSelected(marker);
                  setSelectedPark(null);
                }}
                style={{cursor: 'pointer'}}
              >
                {marker.address}
              </h5>
              :
              <h5
                key={index}
                onClick={() => {
                  mapRef.current.panTo({lat: marker.lat, lng: marker.lng});
                  setSelected(marker);
                  setSelectedPark(null);
                }}
                style={{cursor: 'pointer'}}
              >
                Point {index + 1}
              </h5>
          )}
        </div>
        <div>
          <Button
            onClick={findParks}
            variant="contained"
          >
            Find Parks
          </Button>
          <Button
            onClick={removeAllMarkers}
            variant="outlined"
          >
            Clear All
          </Button>

            <img onClick={locateUser} style={{width: '40px', cursor: 'pointer', position: 'absolute', right: '10px', zIndex: '999', bottom: '200px', borderRadius: '2px'}} src={locateMeIcon}/>
   
          {/* <button
            onClick={() => {setMarkerType('red'); setCurrBlueMarker(null);}}
          >
            Red Marker
          </button>
          <button
            onClick={() => {setMarkerType('blue'); setCurrMarker(null);}}
          >
            Blue Marker
          </button> */}
          <ToggleButtonGroup
            value={markerType}
            exclusive
            onChange={handleMarkerType}
            exlusive={true}
          >
            <ToggleButton value="red">
              <Tooltip
                title="Use this to add user locations"
                componentsProps={{
                  tooltip: {
                    sx: {
                      fontSize: "0.9em"
                    }
                  }
                }}
                arrow
              >
                
                <span>Marker</span>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="blue">
              <Tooltip 
                title="If not satisfied with search results, use this to add points at locations where the search may have missed and re-run the search"
                componentsProps={{
                  tooltip: {
                    sx: {
                      fontSize: "0.9em"
                    }
                  }
                }}
                arrow
              >
              
                <span>Extra Search Point</span>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
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
        
        <div style={{overflow: 'auto', width: '95%'}}>
          {!valid ? <p style={{color: 'red'}}>Given points not in range of each other</p> : null}
          <p>Parks found: {parks.length}</p>
          {parks.map((park, index) => 
            <h5
              key={index}
              style={{margin:'0', cursor: 'pointer'}}
              onClick={() => {
                setSelectedPark(park);
                setSelected(null);
                // mapRef.current.panTo({lat: park.geometry.location.lat, lng: park.geometry.location.lng});
              }}
            >
              {park.name}
            </h5>
          )}
        </div>
      </div>
      <div style={{flex : '3', position: 'relative'}}>
        <div style={{position: 'absolute', zIndex: '998', top: '10px', left: '50%', width: '30%', maxWidth: '400px'}}>
          <Autocomplete panMap={panMap}/>
        </div>
        <Backdrop
        
          sx={{ position: 'absolute', color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={open}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={10}
          center={center}
          onClick={(e) => onMapClick(e)}
          onLoad={onMapLoad}
          options={{
            disableDoubleClickZoom: 'true',
            clickableIcons : false,
            styles: mapStyles,
          }}
        >
          {currMarker ? (<Marker
            position={{lat: currMarker.lat, lng: currMarker.lng}}
            opacity={0.5}
            onClick={confirmMarker}
          />) : null}
          {currBlueMarker ? (<Marker
            position={{lat: currBlueMarker.lat, lng: currBlueMarker.lng}}
            opacity={0.5}
            onClick={confirmBlueMarker}
            icon={'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'}
          />) : null}
          {markers.map((marker, index) => 
            <Marker
              position={{lat: marker.lat, lng: marker.lng}}            
              key={index}
              onClick={() => {
                setSelected(marker);
                setSelectedPark(null);
              }}
              animation={2}
            />
          )}
          {searchMarker ?
            <Marker
              position={{lat: searchMarker.lat, lng: searchMarker.lng}}            
              icon={'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'}
            /> 
            : null
          }
          {blueMarkers.map((marker) => 
            <Marker
              position={{lat: marker.lat, lng: marker.lng}}            
              icon={'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'}
              animation={2}
              onClick={() => setSelectedBlue (marker)}
            />
          )}
          {selectedBlue ?
            <InfoWindow
              position={{lat: selectedBlue.lat, lng: selectedBlue.lng}}
              options={{
                pixelOffset: new window.google.maps.Size(0,-31),
              }}
            >
              <div>
                <button
                  onClick={removeBlue}
                >
                  Delete
                </button>
              </div>
            </InfoWindow>
            :
            null
          }
          {parks.map((park, index) => 
            <Marker
              position={{lat: park.geometry.location.lat, lng: park.geometry.location.lng}}            
              key={index}
              animation={2}
              icon={'http://maps.google.com/mapfiles/ms/icons/green-dot.png'}
              onClick={() => {
                setSelectedPark(park);
                setSelected(null);
              }}
            />
          )}
          {selectedPark ?
            <InfoWindow
              position={{lat: selectedPark.geometry.location.lat, lng: selectedPark.geometry.location.lng}}
              onCloseClick={() => {
                setSelectedPark(null);
              }}
              options={{
                pixelOffset: new window.google.maps.Size(0,-31),
              }}
            >
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <h3 style={{margin: '0'}}>{selectedPark.name}</h3>
                <p>{selectedPark.vicinity}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedPark.geometry.location.lat},${selectedPark.geometry.location.lng}&query_place_id=${selectedPark.place_id}`}
                  style={{textDecoration: 'none', margin: '0'}}
                  target="_blank"
                >
                  Open in Google Maps
                </a>
              </div>
            </InfoWindow>
            :
            null
          }

          {selected ? (<InfoWindow
            position={{lat: selected.lat, lng: selected.lng}}
            onCloseClick={() => setSelected(null)}
            options={{
              pixelOffset: new window.google.maps.Size(0,-43),
            }}
          >
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <h3 style={{margin: '5px'}}>{selected.address ? selected.address : null}</h3>
              <p style={{margin: '5px'}}>{selected.lat}, {selected.lng}</p>
              <div>
                <button
                  onClick={removeMarker}
                >
                  Delete Point
                </button>
              </div>
            </div>
          </InfoWindow>) : null
          }
          {markers.map((marker, index) =>
            <Circle
              key={index}
              options={{
                center: {lat: marker.lat, lng: marker.lng},
                radius: range,
                clickable: false,
                fillOpacity: '0.15'
              }}
            />
           
          )}
        </GoogleMap>
      </div>
    </div>
  
  );
}

export default App;

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

import DeleteIcon from '@mui/icons-material/Delete';

import { styled } from "@mui/material/styles";
import MuiToggleButton from '@mui/material/ToggleButton';

import PinDropIcon from '@mui/icons-material/PinDrop';

import SearchIcon from '@mui/icons-material/Search';

import TextField from '@mui/material/TextField';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from "@mui/material/Divider";

import Paper from "@mui/material/Paper";
import Card from "@mui/material/Card";
import { BorderTopRounded } from '@mui/icons-material';

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import {Helmet} from "react-helmet";

import IconButton from '@mui/material/IconButton';

import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import './App.css';

console.log = function() {}

function App() {
  // https://stackoverflow.com/questions/69707814/set-selected-background-color-of-mui-togglebutton
  const ToggleButton = styled(MuiToggleButton)(({ selectedcolor }) => ({
    "&:hover, &": {
      backgroundColor: "white",
    },
    "&.Mui-selected, &.Mui-selected:hover" : {

      backgroundColor: selectedcolor
    }
  }));

  const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
      padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
      padding: theme.spacing(1),
    },
  }));

  const BootstrapDialogTitle = (props) => {
    const { children, onClose, ...other } = props;
  
    return (
      <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
        {children}
        {onClose ? (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </DialogTitle>
    );
  };

  BootstrapDialogTitle.propTypes = {
    children: PropTypes.node,
    onClose: PropTypes.func.isRequired,
  };
  
  const [openHelp, setOpenHelp] = React.useState(false);

  const handleClickOpenHelp = () => {
    setOpenHelp(true);
  };
  const handleCloseHelp = () => {
    setOpenHelp(false);
  };

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
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
  const [userRange, setUserRange] = React.useState(10);
  const [selectedPark, setSelectedPark] = React.useState(null);
  const [markerType, setMarkerType] = React.useState('red');
  const [blueMarkers, setBlueMarkers] = React.useState([]);
  const [currBlueMarker, setCurrBlueMarker] = React.useState(null);
  const [selectedBlue, setSelectedBlue] = React.useState(null);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false)

  const [openError, setOpenError] = React.useState(false);


  const [openEmpty, setOpenEmpty] = React.useState(false);

  const handleClickEmpty = () => {
    setOpenEmpty(true);
  };

  const handleCloseEmpty = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenEmpty(false);
  };




  
  const handleClickError = () => {
    setOpenError(true);
  };

  const handleCloseError = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenError(false);
  };


  

  const handleClose = () => {
    setOpen(false);
  };
  const handleToggle = () => {
    setOpen(!open);
  };

  const onMapClick = (e) => {
    // console.log(markerType);
    if (markerType === 'red') {
      const newMarker = {
        valid: true,
        address: null,
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      confirmMarker(newMarker);
    } else {
      const newMarker = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      confirmBlueMarker(newMarker);
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

  React.useEffect(() => {
    if (localStorage.getItem('markers')) {
      const savedMarkers = JSON.parse(localStorage.getItem('markers'));
      setMarkers([...savedMarkers]);
    }
    if (localStorage.getItem('blueMarkers')) {
      const savedMarkers = JSON.parse(localStorage.getItem('blueMarkers'))
      setBlueMarkers([...savedMarkers]);
    }
  }, [])

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

  const removeMarkerFromList = ( listMarker ) => {
    var removeArr = markers.filter((marker) => marker.lat !== listMarker.lat && marker.lng !== listMarker.lng);
    // console.log(removeArr);
    setMarkers([...removeArr]);
    setSelected(null);
    localStorage.setItem('markers', JSON.stringify([...removeArr]));
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
    const newMarker = {valid: null, address, lat, lng}
    confirmMarker(newMarker);
  }

  const confirmMarker = (newMarker) => {
    setMarkers([...markers, newMarker]);
    localStorage.setItem('markers', JSON.stringify([...markers, newMarker]));
  }

  const confirmBlueMarker = (newMarker) => {
    setBlueMarkers([...blueMarkers, newMarker]);
    localStorage.setItem('blueMarkers', JSON.stringify([...blueMarkers, newMarker]));
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
    localStorage.setItem('markers', JSON.stringify([...removeArr]));
  }

  const removeBlue = () => {
    var removeArr = blueMarkers.filter((marker) => marker.lat !== selectedBlue.lat && marker.lng !== selectedBlue.lng);
    // console.log(removeArr);
    setBlueMarkers([...removeArr]);
    setSelectedBlue(null);
    localStorage.setItem('blueMarkers', JSON.stringify([...removeArr]));
  }

  const removeAllMarkers = () => {
    setMarkers([]);
    setSelected(null);
    setParks([]);
    setSearchMarker(null);
    setBlueMarkers([]);
    setSelectedBlue(null);
    setSelectedPark(null);
    localStorage.clear();
  }

  const findParks = () => {
    // console.log(markers.length)
    const home = '-33.9488651,151.0494066'
    const radius = '5000'

    if (loading) {
      return;
    }

    if (!checkOverlap()) {
      setValid(false);
      handleClickError();
      return;
    } else {
      setValid(true);
    }

    if (markers.length !== 0) {
      handleToggle();
      setLoading(true);
    }

    if (markers.length === 0) {
      handleClickEmpty();
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
      fetch('/api/find_parks', {
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
        setLoading(false);
      })
      .catch(e => console.log(e));

    } else if (markers.length === 1) {

      console.log('fetching now...')
      const searchArr = [...markers, ...checkInBoundsBlue(blueMarkers)]
      fetch('/api/find_parks', {
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
        setLoading(false);
      })

    }
    
  }

  return (
    <div className="mainContainer">
      <Helmet>
        <meta charSet="utf-8" />
        <title>Park Finder</title>
        <link rel="canonical" href="tamlam.tech" />
      </Helmet>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', maxHeight: '97vh', maxWidth: '400px'}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <h1 style={{margin: '0'}}>Park Finder</h1>
          <h5 style={{margin: '0'}}>Created by Tam Lam</h5>
        </div>
        <div style={{display: 'flex', marginTop: '40px', marginBottom: '20px', flexDirection: 'column', width: '95%'}}>
          <div style={{margin: '5px', display: 'flex'}}>
            <TextField type="number" id="outlined-basic" label="Range (km)" variant="outlined" size="small" style={{maxWidth: '130px', position: 'relative', top: '-1px', marginRight: '5px'}}
              value={userRange}
              onChange={(e) => {
                console.log(e.target.value)
                const validInput = /^[0-9\b]+$/;
                if (e.target.value === '' || validInput.test(e.target.value)) {
                    setUserRange(parseInt(e.target.value));
                    if (e.target.value !== '')
                      setRange(parseInt(e.target.value) * 1000);
                  
                }
              }}
            />
     
            <Button
              onClick={removeAllMarkers}
              variant="contained"
              color={'error'}
              style={{height: '40px', position: 'relative', bottom: '1px', marginLeft: '5px', width: '100%'}}
              startIcon={<DeleteIcon />}
            >
              Clear All
            </Button>
          </div>
            <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
              <HelpOutlineIcon
                style={{color: '#8c8c8c', cursor: 'pointer'}}
                onClick={handleClickOpenHelp}
              />
              <Button
                onClick={findParks}
                variant="contained"
                style={{margin: '5px', backgroundColor: '#00b090', width: '100%'}}
                startIcon={<SearchIcon />}
              >
                Find Parks
              </Button>
              
            </div>
        </div>
        <div>
          
          <BootstrapDialog
            onClose={handleCloseHelp}
            open={openHelp}
          >
            <BootstrapDialogTitle id="customized-dialog-title" onClose={handleCloseHelp}>
              How to Use Park Finder
            </BootstrapDialogTitle>
            <DialogContent dividers>
              <Typography gutterBottom>
                To find parks around a single area, simply click on the map to add a marker and click the <b>Find Parks</b> button.
              </Typography>
              <Typography gutterBottom>
                If multiple markers are placed, the parks common in the ranges of the all markers are shown instead. Note, all markers must be in range of each other for this to work.
              </Typography>
              <Typography gutterBottom>
                If you are not satisfied with the search results, the <b>Extra Search Point</b> toggle in the bottom right can be used to add extra search markers on the map (alongside the normal red markers). Extra searches will be done around these markers and any valid results will be displayed along with the original search. <b>Use sparingly as each extra search point marker will add ~6 seconds to the search time.</b>
              </Typography>
            </DialogContent>
          </BootstrapDialog>
        </div>
        <>
          {markers.length > 0 ?
          <>
            <Paper
              elevation={0}
              style={{
                width: '90%',
                margin: '10px',
                backgroundColor: '#e9e9ed',
                display: 'flex',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              {markers.length > 0 ? <p className="scrolls" style={{margin: '5px', padding: '15px'}}>MARKERS</p> : null} 
            </Paper> 
            
            <Paper className="scrolls" style={{overflow: 'auto', width: '90%', height: '40vh', marginBottom: '10px'}}>
              <List>
                {markers.map((marker, index) => marker.address ?



                  <div key={index}>
                    <ListItem
                      disablePadding
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => removeMarkerFromList(marker)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemButton
                        
                        onClick={() => {
                          mapRef.current.panTo({lat: marker.lat, lng: marker.lng});
                          setSelected(marker);
                          setSelectedPark(null);
                        }}
                      >
                        {/* <ListItemText primary={marker.address} /> */}
                        <h5 style={{margin: '0', fontWeight: 'normal'}}>{marker.address}</h5>
                      </ListItemButton>
                    </ListItem>
                    <>
                      { index < markers.length - 1 ?
                        <Divider light={true} variant={'middle'}/> : null
                      }
                    </>
                  </div>
                  :
                  <div>
                    <ListItem
                      disablePadding
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => removeMarkerFromList(marker)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemButton
                        key={index}
                        onClick={() => {
                          mapRef.current.panTo({lat: marker.lat, lng: marker.lng});
                          setSelected(marker);
                          setSelectedPark(null);
                        }}
                      >
                        {/* <ListItemText primary={`Point ${index + 1}`} /> */}
                        <h5 style={{margin: '0', fontWeight: 'normal'}}>{`Point ${index + 1}`}</h5>
                          
                      </ListItemButton>
                    </ListItem>
                    <>
                      { index < markers.length - 1 ?
                        <Divider light={true} variant={'middle'}/> : null
                      }
                    </>
                  </div>
                )}
              </List>
            </Paper>
          </>
          :
          null
          }
        </>

        
        


      {parks.length > 0 ?
        <>
          <Paper
            elevation={0}
            classname="parksfound"
            style={{
              width: '90%',
              marginBottom: '10px',
              backgroundColor: '#e9e9ed',
              display: 'flex',
              justifyContent: 'center',
              
            }}
          >
            {/* {!valid ? <p style={{color: 'red'}}>Given points not in range of each other</p> : null} */}
            {parks.length > 0 ? <p style={{margin: '5px', padding: '15px', fontWeight: 'bold'}}>{parks.length} PARKS FOUND</p> : null} 
          </Paper> 
          <Paper className="scrolls" style={{overflow: 'auto', width: '90%', height: '50vh'}}>
            {parks.map((park, index) => 
              <div key={index}>
                <ListItem disablePadding>
                  <ListItemButton
                    key={index}
                    style={{margin:'0', cursor: 'pointer'}}
                    onClick={() => {
                      setSelectedPark(park);
                      setSelected(null);
                      // mapRef.current.panTo({lat: park.geometry.location.lat, lng: park.geometry.location.lng});
                    }}
                  >
                    {/* <ListItemText primary={marker.address} /> */}
                    <h5 style={{margin: '0', fontWeight: 'normal'}}>{park.name}</h5>
                  </ListItemButton>
                </ListItem>
                <>
                  { index < parks.length - 1 ?
                    <Divider light={true} variant={'middle'}/> : null
                  }
                </>
              </div>
            )}
          </Paper>
        </>
      :
        null
      }











      </div>
      <div className="halvesmap">
        
        
        
        <Snackbar open={openError} autoHideDuration={3000} onClose={handleCloseError} anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
          <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
            Given markers not in range of each other
          </Alert>
        </Snackbar>

        <Snackbar open={openEmpty} autoHideDuration={3000} onClose={handleCloseEmpty} anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}>
          <Alert onClose={handleCloseEmpty} severity="error" sx={{ width: '100%' }}>
            There are no markers on the map
          </Alert>
        </Snackbar>



        <div style={{position: 'absolute', top: '10px', left: '50%', zIndex: '50', translate: '-50%', zIndex: '998', width: '30%', maxWidth: '400px', minWidth: '200px'}}>
          <Autocomplete className="search" panMap={panMap}/>
        </div>
        {/* <Backdrop
        
          sx={{ position: 'absolute', color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={open}
        >
        </Backdrop> */}
        {/* <CircularProgress style={{position: 'absolute', top: '50%', left: '50%', zIndex: '50'}} color="inherit" /> */}
        {loading ?
          <CircularProgress size={100} style={{position: 'absolute', top: '50%', left: '50%', zIndex: '50', translate: '-50%', color: '#404040'}}/>
          :
          null
        }
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
            fullscreenControl: false,
            mapTypeControl: false
          }}
        >
          <img onClick={locateUser} style={{width: '40px', cursor: 'pointer', position: 'absolute', right: '10px', zIndex: '999', bottom: '200px', borderRadius: '2px'}} src={locateMeIcon}/>

        <ToggleButtonGroup
          value={markerType}
          exclusive
          onChange={handleMarkerType}
          style={{position: 'absolute', right: '80px', bottom: '28px'}}
          sx={{zIndex: '100'}}
        >
          <ToggleButton value="red" selectedcolor="#ffd1d1">
            {markerType === 'red' ? 
              <PinDropIcon color={'error'}/>
              :
              <PinDropIcon/>
            }
            <Tooltip
              title="Use this to add user locations"
              componentsProps={{
                tooltip: {
                  sx: {
                    fontSize: "0.9em",
                    bottom: '4px'
                  }
                }
              }}
              placement={'top'}
              arrow
            >
              
              <span className="toggle">Marker</span>
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="blue" selectedcolor="#d4e7ff">
            {markerType === 'blue' ? 
              <PinDropIcon color={'primary'}/>
              :
              <PinDropIcon/>
            }
            
            <Tooltip 
              title="If not satisfied with search results, use this to add points at locations where the search may have missed and re-run the search"
              componentsProps={{
                tooltip: {
                  sx: {
                    fontSize: "0.9em",
                    bottom: '4px',
                    right: '50px'
                  }
                }
              }}
              arrow
            >
            
              <span className="toggle">Extra Search Point</span>
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
          {markers.map((marker, index) => 
            <Marker
              position={{lat: marker.lat, lng: marker.lng}}            
              key={index}
              onClick={() => {
                setSelected(marker);
                setSelectedPark(null);
                setSelectedBlue(null);
              }}
              animation={2}
            />
          )}
          {/* {searchMarker ?
            <Marker
              position={{lat: searchMarker.lat, lng: searchMarker.lng}}            
              icon={'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'}
            /> 
            : null
          } */}
          {blueMarkers.map((marker, index) => 
            <Marker
              position={{lat: marker.lat, lng: marker.lng}}            
              icon={'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'}
              animation={2}
              key={index}
              onClick={() => {
                setSelectedBlue(marker);
                setSelected(null);
              }}
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
                <Button
                  onClick={removeBlue}
                  startIcon={<DeleteIcon />}
                >
                  Delete Point
                </Button>
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
            <div style={{ margin: '3px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0'}}>
              <h3 style={{margin: '0'}}>{selected.address ? selected.address : null}</h3>
              {/* <p style={{margin: '5px'}}>{selected.lat}, {selected.lng}</p> */}
              <div>
                <Button
                  onClick={removeMarker}
                  startIcon={<DeleteIcon />}
                  color={'error'}
                >
                  Delete Point
                </Button>
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

import React from 'react';

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {  
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
  ComboboxOptionText,
} from "@reach/combobox";
import { findByLabelText } from '@testing-library/react';
import "@reach/combobox/styles.css";

const Autocomplete = ({ panMap }) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      location: {
        lat: () => -33.868820,
        lng: () => 151.209290
      },
      radius: 200000
    },
    debounce: 300,
  });

  const inputContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '30vw',
    height: '20px',
    padding: '10px'
  };

  const searchStyle = {
    width: '25vw',
    height: '20px',
  };

  // const ref = useOnclickOutside(() => {
  //   clearSuggestions();
  // });

  const [address, setAddress] = React.useState('null')

  const initialRender = React.useRef(true);
  React.useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    getGeocode({ address: address })
    .then((results) => getLatLng(results[0]))
    .then(({ lat, lng }) => {
      console.log("Coordinates: ", { lat, lng });
      panMap({address, lat, lng});
    })
    .catch((error) => {
      console.log("Error: ", error);
    });

  }, [address]);
  
  return (
    <div style={{width: '90%'}}>
      <Combobox
        onSelect={(e) => {setAddress(e)}}
        
      >
        <ComboboxInput 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready} 
          placeholder={'Search location'}
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
          }}
        />
        <ComboboxPopover style={{borderRadius: '5px'}}>
          <ComboboxList>
            {status === "OK" &&
              data.map(({ place_id, description }) => (
                <ComboboxOption
                  key={place_id}
                  value={description}
                  style={{
                    padding: '0.5rem',
                    fontSize: '1rem',
                    width: '95%'
                  }}
                />
              ))}
          </ComboboxList>
        </ComboboxPopover>
      </Combobox>
    </div>
  );
};

export default Autocomplete;

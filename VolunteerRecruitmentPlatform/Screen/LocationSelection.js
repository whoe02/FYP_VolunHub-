import 'react-native-get-random-values';
import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Geocoder from 'react-native-geocoding';
import { useNavigation } from '@react-navigation/native';

Geocoder.init('AIzaSyDmpiHdkyhItoKFv5HWfx0XBixlK2vWqno'); // Initialize Geocoding

const MapWithSearch = ({route }) => {
  const navigation = useNavigation(); // Access navigation object
  const mapRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: 4.2105, // Malaysia latitude
    longitude: 101.9758, // Malaysia longitude
    latitudeDelta: 5.0,
    longitudeDelta: 5.0,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const onPlaceSelected = (data, details) => {
    const { lat, lng } = details.geometry.location;
    const newRegion = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };
    setRegion(newRegion);
    setSelectedLocation({ latitude: lat, longitude: lng });
    setSelectedAddress(details.formatted_address);
    mapRef.current.animateToRegion(newRegion, 1000);
  };

  const confirmLocation = () => {
    setLatitude(selectedLocation.latitude);
    setLongitude(selectedLocation.longitude);

    console.log("Address:", selectedAddress);
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);
    if (selectedAddress && latitude && longitude) {
      // Pass data back to the previous screen using the callback
      if (route.params?.onLocationSelected) {
        route.params.onLocationSelected(selectedAddress, latitude, longitude);  // Pass each value separately
      }
  
      // Navigate back to the previous screen
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder="Search for a place"
        fetchDetails
        onPress={onPlaceSelected}
        query={{
          key: 'AIzaSyDmpiHdkyhItoKFv5HWfx0XBixlK2vWqno',
          language: 'en',
        }}
        styles={{
          container: styles.searchContainer,
          textInput: styles.searchInput,
        }}
      />
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
      >
        {selectedLocation && (
          <Marker coordinate={selectedLocation} title={selectedAddress || 'Selected Location'} />
        )}
      </MapView>
      {selectedLocation && (
        <TouchableOpacity style={styles.confirmButton} onPress={confirmLocation}>
          <Text style={styles.confirmText}>✔</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  searchInput: {
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  confirmButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  confirmText: {
    fontSize: 30,
    color: '#fff',
  },
});

export default MapWithSearch;

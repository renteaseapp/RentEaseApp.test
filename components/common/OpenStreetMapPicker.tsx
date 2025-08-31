import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { FaMapMarkerAlt, FaSearch, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  lat: number;
  lng: number;
  address?: string;
  formattedAddress?: string;
}

interface OpenStreetMapPickerProps {
  initialLocation?: Location;
  latitude?: number;
  longitude?: number;
  onLocationSelect: (location: Location) => void;
  height?: string;
  width?: string;
  showSearch?: boolean;
  showCurrentLocation?: boolean;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  zoom?: number;
}

const defaultCenter = {
  lat: 13.7563, // Bangkok coordinates
  lng: 100.5018
};

// Component for handling map clicks
const MapClickHandler: React.FC<{
  onLocationSelect: (location: Location) => void;
  setSelectedLocation: (location: Location) => void;
}> = ({ onLocationSelect, setSelectedLocation }) => {
  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      try {
        // Use Nominatim for reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
        );
        const data = await response.json();
        
        const location: Location = {
          lat,
          lng,
          address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          formattedAddress: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        };
        
        setSelectedLocation(location);
        onLocationSelect(location);
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        const location: Location = {
          lat,
          lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        };
        
        setSelectedLocation(location);
        onLocationSelect(location);
      }
    },
  });
  
  return null;
};

export const OpenStreetMapPicker: React.FC<OpenStreetMapPickerProps> = ({
  initialLocation,
  latitude,
  longitude,
  onLocationSelect,
  height = '400px',
  width = '100%',
  showSearch = true,
  showCurrentLocation = true,
  placeholder,
  className = '',
  readOnly = false,
  zoom = 13
}) => {
  const { t } = useTranslation();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(() => {
    if (latitude && longitude) {
      return { lat: latitude, lng: longitude };
    }
    return initialLocation || null;
  });
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mapKey, setMapKey] = useState(0); // For forcing map re-render

  // Update selectedLocation when latitude/longitude props change
  useEffect(() => {
    if (latitude && longitude) {
      setSelectedLocation({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  const handleSearch = useCallback(async () => {
    if (!searchValue.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Use Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchValue)}&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const location: Location = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name,
          formattedAddress: result.display_name
        };
        
        setSelectedLocation(location);
        onLocationSelect(location);
        setMapKey(prev => prev + 1); // Force map re-render to center on new location
      } else {
        alert(t('googleMaps.searchNotFound', 'ไม่พบตำแหน่งที่ค้นหา'));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert(t('googleMaps.searchError', 'เกิดข้อผิดพลาดในการค้นหา'));
    } finally {
      setIsLoading(false);
    }
  }, [searchValue, onLocationSelect, t]);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          try {
            // Use Nominatim for reverse geocoding
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
            );
            const data = await response.json();
            
            const location: Location = {
              lat,
              lng,
              address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              formattedAddress: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            };
            
            setSelectedLocation(location);
            onLocationSelect(location);
            setMapKey(prev => prev + 1); // Force map re-render
          } catch (error) {
            console.error('Reverse geocoding error:', error);
            const location: Location = {
              lat,
              lng,
              address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            };
            
            setSelectedLocation(location);
            onLocationSelect(location);
            setMapKey(prev => prev + 1);
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          setIsLoading(false);
          alert(t('googleMaps.locationError', 'ไม่สามารถเข้าถึงตำแหน่งปัจจุบันได้'));
        }
      );
    } else {
      alert(t('googleMaps.geolocationNotSupported', 'เบราว์เซอร์ไม่รองรับการหาตำแหน่ง'));
    }
  }, [onLocationSelect, t]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSelection = () => {
    setSelectedLocation(null);
    setSearchValue('');
  };

  const mapCenter = selectedLocation || initialLocation || defaultCenter;

  return (
    <div className={`openstreetmap-picker ${className}`}>
      {/* Search Controls */}
      {!readOnly && showSearch && (
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder || t('googleMaps.searchPlaceholder', 'ค้นหาตำแหน่ง...')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchValue && (
                <button
                  onClick={() => setSearchValue('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchValue.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FaSearch className="h-4 w-4" />
              {t('googleMaps.search', 'ค้นหา')}
            </button>
          </div>
          
          <div className="flex gap-2">
            {showCurrentLocation && (
              <button
                onClick={getCurrentLocation}
                disabled={isLoading}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <FaMapMarkerAlt className="h-3 w-3" />
                {t('googleMaps.currentLocation', 'ตำแหน่งปัจจุบัน')}
              </button>
            )}
            
            {selectedLocation && (
              <button
                onClick={clearSelection}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 flex items-center gap-1"
              >
                <FaTimes className="h-3 w-3" />
                {t('googleMaps.clear', 'ล้าง')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <FaMapMarkerAlt className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                {t('googleMaps.selectedLocation', 'ตำแหน่งที่เลือก')}:
              </p>
              <p className="text-sm text-blue-700">
                {selectedLocation.formattedAddress || selectedLocation.address}
              </p>
              <p className="text-xs text-blue-600">
                {t('googleMaps.coordinates', 'พิกัด')}: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mb-4 flex items-center justify-center p-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">
            {t('googleMaps.loading', 'กำลังโหลด...')}
          </span>
        </div>
      )}

      {/* Map */}
      <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height, width }}>
        <MapContainer
          key={mapKey}
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={selectedLocation ? zoom : 10}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={!readOnly}
          doubleClickZoom={!readOnly}
          dragging={!readOnly}
          zoomControl={!readOnly}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {!readOnly && (
            <MapClickHandler 
              onLocationSelect={onLocationSelect} 
              setSelectedLocation={setSelectedLocation} 
            />
          )}
          
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
              <Popup>
                <div className="p-2 max-w-xs">
                  <h3 className="font-medium text-gray-800 mb-1">
                    {t('googleMaps.selectedLocation', 'ตำแหน่งที่เลือก')}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedLocation.formattedAddress || selectedLocation.address}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Instructions */}
      <div className="mt-2 text-xs text-gray-500">
        {t('googleMaps.instruction', 'คลิกบนแผนที่เพื่อเลือกตำแหน่ง หรือใช้ช่องค้นหาด้านบน')}
      </div>
    </div>
  );
};

export default OpenStreetMapPicker;
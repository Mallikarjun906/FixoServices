import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LocationTrackerProps {
  bookingId: string;
  providerId: string;
  customerAddress: string;
  isProvider?: boolean;
}

interface ProviderLocation {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  updated_at: string;
}

const LocationTracker: React.FC<LocationTrackerProps> = ({
  bookingId,
  providerId,
  customerAddress,
  isProvider = false,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const providerMarker = useRef<mapboxgl.Marker | null>(null);
  const customerMarker = useRef<mapboxgl.Marker | null>(null);
  
  const [location, setLocation] = useState<ProviderLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Set Mapbox access token - you'll need to replace this with your actual token
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.5, 40], // Default center
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  // Subscribe to location updates
  useEffect(() => {
    const channel = supabase
      .channel('location_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'provider_locations',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          console.log('Location update:', payload);
          if (payload.new) {
            setLocation(payload.new as ProviderLocation);
            updateMapLocation(payload.new as ProviderLocation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const updateMapLocation = (newLocation: ProviderLocation) => {
    if (!map.current) return;

    // Update provider marker
    if (providerMarker.current) {
      providerMarker.current.setLngLat([newLocation.longitude, newLocation.latitude]);
    } else {
      // Create provider marker
      const el = document.createElement('div');
      el.className = 'provider-marker';
      el.style.backgroundImage = 'url(/provider-marker.png)';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#3b82f6';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      providerMarker.current = new mapboxgl.Marker(el)
        .setLngLat([newLocation.longitude, newLocation.latitude])
        .setPopup(new mapboxgl.Popup().setHTML('<h3>Service Provider</h3><p>Current location</p>'))
        .addTo(map.current!);
    }

    // Center map on provider location
    map.current.flyTo({
      center: [newLocation.longitude, newLocation.latitude],
      zoom: 15,
      essential: true,
    });
  };

  const startLocationTracking = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location tracking",
        variant: "destructive",
      });
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    };

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;

        try {
          const { error } = await supabase
            .from('provider_locations')
            .upsert({
              provider_id: providerId,
              booking_id: bookingId,
              latitude,
              longitude,
              accuracy,
              heading: heading || undefined,
              speed: speed || undefined,
              is_active: true,
            }, {
              onConflict: 'provider_id,booking_id',
            });

          if (error) throw error;

          console.log('Location updated:', { latitude, longitude });
        } catch (error) {
          console.error('Failed to update location:', error);
          toast({
            title: "Location update failed",
            description: "Failed to share your location",
            variant: "destructive",
          });
        }
      },
      (error) => {
        console.error('Location error:', error);
        toast({
          title: "Location error",
          description: "Failed to get your location",
          variant: "destructive",
        });
      },
      options
    );

    setWatchId(watchId);
    setIsTracking(true);
  };

  const stopLocationTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  };

  const refreshLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_locations')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setLocation(data);
        updateMapLocation(data);
      }
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to get latest location",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Location Tracking
            </CardTitle>
            <Badge variant={location ? "default" : "secondary"}>
              {location ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isProvider ? (
              <div className="flex gap-2">
                <Button
                  onClick={isTracking ? stopLocationTracking : startLocationTracking}
                  variant={isTracking ? "destructive" : "default"}
                  className="flex-1"
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  {isTracking ? "Stop Sharing Location" : "Start Sharing Location"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={refreshLocation} variant="outline" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Location
                </Button>
              </div>
            )}

            {location && (
              <div className="text-sm text-muted-foreground">
                <p>Last updated: {new Date(location.updated_at).toLocaleTimeString()}</p>
                {location.accuracy && (
                  <p>Accuracy: ±{Math.round(location.accuracy)}m</p>
                )}
                {location.speed && (
                  <p>Speed: {Math.round(location.speed * 3.6)} km/h</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div ref={mapContainer} className="h-96 w-full rounded-lg shadow-lg" />
    </div>
  );
};

export default LocationTracker;
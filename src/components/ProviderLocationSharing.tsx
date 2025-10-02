import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProviderLocationSharingProps {
  bookingId: string;
  providerId: string;
}

const ProviderLocationSharing: React.FC<ProviderLocationSharingProps> = ({
  bookingId,
  providerId,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Check if already sharing location for this booking
    checkExistingLocation();
    
    return () => {
      stopLocationSharing();
    };
  }, [bookingId]);

  const checkExistingLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_locations')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setLastUpdate(new Date(data.updated_at));
        setAccuracy(data.accuracy);
      }
    } catch (error) {
      console.error('Error checking existing location:', error);
    }
  };

  const startLocationSharing = async () => {
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
      maximumAge: 30000, // Use cached position if less than 30 seconds old
    };

    const updateLocation = async (position: GeolocationPosition) => {
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
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'provider_id,booking_id',
          });

        if (error) throw error;

        setLastUpdate(new Date());
        setAccuracy(accuracy);
        console.log('Location updated:', { latitude, longitude, accuracy });
      } catch (error) {
        console.error('Failed to update location:', error);
        toast({
          title: "Location update failed",
          description: "Failed to share your location. Please try again.",
          variant: "destructive",
        });
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error('Location error:', error);
      let message = "Failed to get your location";
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Location access denied. Please enable location permissions.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "Location information unavailable.";
          break;
        case error.TIMEOUT:
          message = "Location request timed out.";
          break;
      }

      toast({
        title: "Location error",
        description: message,
        variant: "destructive",
      });
      
      setIsSharing(false);
    };

    try {
      // Get initial position
      navigator.geolocation.getCurrentPosition(updateLocation, handleError, options);

      // Start watching position
      const watchId = navigator.geolocation.watchPosition(
        updateLocation,
        handleError,
        options
      );

      setWatchId(watchId);
      setIsSharing(true);

      toast({
        title: "Location sharing started",
        description: "Your location is now being shared with the customer",
      });
    } catch (error) {
      console.error('Error starting location sharing:', error);
      toast({
        title: "Error",
        description: "Failed to start location sharing",
        variant: "destructive",
      });
    }
  };

  const stopLocationSharing = async () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    try {
      // Mark location as inactive
      const { error } = await supabase
        .from('provider_locations')
        .update({ is_active: false })
        .eq('provider_id', providerId)
        .eq('booking_id', bookingId);

      if (error) throw error;

      setIsSharing(false);
      toast({
        title: "Location sharing stopped",
        description: "Your location is no longer being shared",
      });
    } catch (error) {
      console.error('Error stopping location sharing:', error);
    }
  };

  const forceLocationUpdate = async () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
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
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'provider_id,booking_id',
            });

          if (error) throw error;

          setLastUpdate(new Date());
          setAccuracy(accuracy);

          toast({
            title: "Location updated",
            description: "Your current location has been sent to the customer",
          });
        } catch (error) {
          toast({
            title: "Update failed",
            description: "Failed to update your location",
            variant: "destructive",
          });
        }
      },
      (error) => {
        toast({
          title: "Location error",
          description: "Failed to get your current location",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Sharing
          </CardTitle>
          <Badge variant={isSharing ? "default" : "secondary"}>
            {isSharing ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={isSharing ? stopLocationSharing : startLocationSharing}
            variant={isSharing ? "destructive" : "default"}
            className="flex-1"
          >
            <Navigation className="mr-2 h-4 w-4" />
            {isSharing ? "Stop Sharing" : "Start Sharing Location"}
          </Button>
          
          {isSharing && (
            <Button onClick={forceLocationUpdate} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {lastUpdate && (
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Last updated: {lastUpdate.toLocaleTimeString()}</p>
            {accuracy && <p>Accuracy: ±{Math.round(accuracy)}m</p>}
          </div>
        )}

        {isSharing && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>Your location is being shared with the customer for this booking.</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Location sharing helps customers track your arrival</p>
          <p>• Your location is only shared during active bookings</p>
          <p>• You can stop sharing anytime</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderLocationSharing;
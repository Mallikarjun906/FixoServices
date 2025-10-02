import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, MapPin, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import LocationTracker from "@/components/maps/LocationTracker";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  total_amount: number;
  status: string;
  payment_status: string;
  customer_address: string;
  customer_notes: string;
  provider_notes: string;
  services: {
    name: string;
    description: string;
    duration_minutes: number;
  };
  provider_profiles: {
    id: string;
    business_name: string;
    rating: number;
    profiles: {
      full_name: string;
      phone_number: string;
    } | null;
  } | null;
}

const TrackBooking = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId, user, navigate]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            name,
            description,
            duration_minutes
          ),
          provider_profiles (
            id,
            business_name,
            rating,
            profiles (
              full_name,
              phone_number
            )
          )
        `)
        .eq('id', bookingId)
        .eq('customer_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({
          title: "Booking not found",
          description: "The booking you're looking for doesn't exist or you don't have access to it.",
          variant: "destructive",
        });
        navigate('/bookings');
        return;
      }

      setBooking(data as any);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch booking details",
        variant: "destructive",
      });
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Booking not found</h1>
          <Button onClick={() => navigate('/bookings')}>
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/bookings')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Track Your Service</h1>
            <p className="text-muted-foreground">
              Booking ID: {booking.id.slice(0, 8)}...
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Booking Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{booking.services.name}</span>
                  <div className="flex flex-col gap-1">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                    <Badge className={getPaymentStatusColor(booking.payment_status)}>
                      {booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(booking.booking_date), 'PPP')} at {booking.booking_time}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">{booking.customer_address}</span>
                </div>

                <Separator />

                {booking.provider_profiles && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{booking.provider_profiles.business_name}</span>
                    </div>
                    
                    {booking.provider_profiles.profiles?.phone_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${booking.provider_profiles.profiles.phone_number}`}
                          className="text-primary hover:underline"
                        >
                          {booking.provider_profiles.profiles.phone_number}
                        </a>
                      </div>
                    )}
                    
                    <div className="text-sm">
                      Rating: ⭐ {booking.provider_profiles.rating}/5
                    </div>
                  </div>
                )}

                <Separator />

                <div className="text-lg font-semibold text-primary">
                  Total: ₹{booking.total_amount}
                </div>

                {booking.customer_notes && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm font-medium">Your Notes: </span>
                      <span className="text-sm text-muted-foreground">{booking.customer_notes}</span>
                    </div>
                  </>
                )}

                {booking.provider_notes && (
                  <div>
                    <span className="text-sm font-medium">Provider Notes: </span>
                    <span className="text-sm text-muted-foreground">{booking.provider_notes}</span>
                  </div>
                )}

                {booking.payment_status === 'pending' && (
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/payment?booking=${booking.id}`)}
                  >
                    Pay Now
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Location Tracking */}
          <div className="lg:col-span-2">
            {booking.provider_profiles && (
              <LocationTracker
                bookingId={booking.id}
                providerId={booking.provider_profiles.id}
                customerAddress={booking.customer_address}
                isProvider={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackBooking;
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Phone, User } from "lucide-react";

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
    business_name: string;
    rating: number;
    profiles: {
      full_name: string;
      phone_number: string;
    } | null;
  } | null;
}

const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
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
            business_name,
            rating,
            profiles (
              full_name,
              phone_number
            )
          )
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data as any) || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
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
      case 'pay_after_service':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterBookings = (status?: string) => {
    if (!status) return bookings;
    return bookings.filter(booking => booking.status === status);
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{booking.services.name}</CardTitle>
          <div className="flex gap-2">
            <Badge className={getStatusColor(booking.status)}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
            <Badge className={getPaymentStatusColor(booking.payment_status)}>
              {booking.payment_status === 'pay_after_service' 
                ? 'Pay After Service' 
                : booking.payment_status.charAt(0).toUpperCase() + booking.payment_status.slice(1)}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Booking ID: {booking.id.slice(0, 8)}...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(booking.booking_date), 'PPP')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{booking.booking_time} ({booking.services.duration_minutes} mins)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs">{booking.customer_address}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{booking.provider_profiles?.business_name || 'Provider TBD'}</span>
            </div>
            {booking.provider_profiles?.profiles?.phone_number && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{booking.provider_profiles.profiles.phone_number}</span>
              </div>
            )}
            <div className="text-lg font-semibold text-primary">
              ₹{booking.total_amount}
            </div>
          </div>
        </div>
        {(booking.customer_notes || booking.provider_notes) && (
          <div className="mt-4 pt-4 border-t">
            {booking.customer_notes && (
              <div className="mb-2">
                <span className="text-sm font-medium">Your Notes: </span>
                <span className="text-sm text-muted-foreground">{booking.customer_notes}</span>
              </div>
            )}
            {booking.provider_notes && (
              <div>
                <span className="text-sm font-medium">Provider Notes: </span>
                <span className="text-sm text-muted-foreground">{booking.provider_notes}</span>
              </div>
            )}
          </div>
        )}
        {(booking.payment_status === 'pending' || (booking.payment_status === 'pay_after_service' && booking.status === 'completed')) && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.location.href = `/payment?booking=${booking.id}`}
            >
              {booking.payment_status === 'pay_after_service' ? 'Pay for Completed Service' : 'Pay Now'}
            </Button>
          </div>
        )}
        {(booking.status === 'accepted' || booking.status === 'in_progress') && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              className="w-full" 
              onClick={() => window.location.href = `/track-booking/${booking.id}`}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Track Service
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground">
          Track and manage all your service bookings
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({filterBookings('pending').length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted ({filterBookings('accepted').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filterBookings('completed').length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({filterBookings('cancelled').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't made any bookings yet. Start by browsing our services.
              </p>
              <Button onClick={() => window.location.href = '/services'}>
                Browse Services
              </Button>
            </div>
          ) : (
            <div>
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <div>
            {filterBookings('pending').map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          <div>
            {filterBookings('accepted').map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div>
            {filterBookings('completed').map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          <div>
            {filterBookings('cancelled').map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyBookings;
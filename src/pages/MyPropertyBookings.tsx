import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, User, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface PropertyBooking {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  monthly_rent: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  tenant_notes?: string;
  owner_notes?: string;
  created_at: string;
  property: {
    title: string;
    location: string;
    property_type: 'home' | 'shop';
    images: string[];
  };
}

const MyPropertyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<PropertyBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('property_bookings')
        .select(`
          *,
          properties(title, location, property_type, images)
        `)
        .eq('tenant_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data || []) as unknown as PropertyBooking[]);
    } catch (error) {
      console.error('Error fetching property bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load your property bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const { error } = await supabase
        .from('property_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });

      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'secondary';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to view your property bookings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your property bookings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">My Property Bookings</h1>
            <p className="text-muted-foreground">Track your rental bookings</p>
          </div>
          <Button asChild>
            <Link to="/properties">Browse Properties</Link>
          </Button>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-4">You haven't made any property bookings yet.</p>
            <Button asChild>
              <Link to="/properties">Browse Properties</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {booking.property?.title || 'Property Unavailable'}
                      </CardTitle>
                      <div className="flex items-center text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {booking.property?.location || 'Location not available'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      <Badge variant={getPaymentStatusColor(booking.payment_status)}>
                        {booking.payment_status}
                      </Badge>
                      {booking.property && (
                        <Badge variant={booking.property.property_type === 'home' ? 'default' : 'secondary'}>
                          {booking.property.property_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Property Image */}
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      {booking.property?.images && booking.property.images.length > 0 ? (
                        <img
                          src={booking.property.images[0]}
                          alt={booking.property.title || 'Property'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Booking Details */}
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">
                          {formatPrice(booking.monthly_rent)}/month
                        </span>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        Total: {formatPrice(booking.total_amount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Booked on {formatDate(booking.created_at)}
                      </div>
                    </div>

                    {/* Actions & Notes */}
                    <div className="space-y-3">
                      {booking.tenant_notes && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Your Notes</h4>
                          <p className="text-sm text-muted-foreground">{booking.tenant_notes}</p>
                        </div>
                      )}
                      {booking.owner_notes && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">Owner Notes</h4>
                          <p className="text-sm text-muted-foreground">{booking.owner_notes}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/property/${booking.property_id}`}>View Property</Link>
                        </Button>
                        {booking.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPropertyBookings;
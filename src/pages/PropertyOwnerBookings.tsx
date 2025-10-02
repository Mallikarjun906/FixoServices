import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, User, DollarSign, Phone, Mail } from 'lucide-react';
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
  tenant_id: string;
  property: {
    title: string;
    location: string;
    property_type: 'home' | 'shop';
    images: string[];
  };
  tenant: {
    full_name: string;
    phone_number?: string;
    user_id: string;
  } | null;
}

const PropertyOwnerBookings = () => {
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
          property:properties!property_bookings_property_id_fkey(title, location, property_type, images),
          tenant:profiles!property_bookings_tenant_id_fkey(full_name, phone_number, user_id)
        `)
        .in('property_id', 
          await supabase
            .from('properties')
            .select('id')
            .eq('owner_id', user?.id)
            .then(({ data }) => data?.map(p => p.id) || [])
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data || []) as unknown as PropertyBooking[]);
    } catch (error) {
      console.error('Error fetching property bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load property booking requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('property_bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Booking ${status} successfully`,
      });

      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
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
          <p className="text-muted-foreground">Please sign in to view booking requests.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading booking requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Property Booking Requests</h1>
            <p className="text-muted-foreground">Manage booking requests for your properties</p>
          </div>
          <Button asChild>
            <Link to="/manage-properties">Manage Properties</Link>
          </Button>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No booking requests yet</h3>
            <p className="text-muted-foreground mb-4">You haven't received any booking requests for your properties yet.</p>
            <Button asChild>
              <Link to="/manage-properties">Manage Properties</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{booking.property.title}</CardTitle>
                      <div className="flex items-center text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {booking.property.location}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      <Badge variant={getPaymentStatusColor(booking.payment_status)}>
                        {booking.payment_status}
                      </Badge>
                      <Badge variant={booking.property.property_type === 'home' ? 'default' : 'secondary'}>
                        {booking.property.property_type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Property Image */}
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      {booking.property.images && booking.property.images.length > 0 ? (
                        <img
                          src={booking.property.images[0]}
                          alt={booking.property.title}
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
                      <h4 className="font-medium">Booking Details</h4>
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
                        Requested on {formatDate(booking.created_at)}
                      </div>
                    </div>

                    {/* Tenant Information */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Tenant Information</h4>
                      {booking.tenant ? (
                        <>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm">{booking.tenant.full_name}</span>
                          </div>
                          {booking.tenant.phone_number && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="text-sm">{booking.tenant.phone_number}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">Tenant information not available</span>
                      )}
                      {booking.tenant_notes && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Tenant Notes</h5>
                          <p className="text-sm text-muted-foreground">{booking.tenant_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Actions</h4>
                      <div className="flex flex-col gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                            >
                              Confirm Booking
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                            >
                              Decline Booking
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/property/${booking.property_id}`}>View Property</Link>
                        </Button>
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

export default PropertyOwnerBookings;
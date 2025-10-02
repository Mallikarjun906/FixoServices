import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, DollarSign, Clock, Star, User, Wrench, Home } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ServiceBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  payment_status: string;
  total_amount: number;
  customer_address: string;
  customer_notes?: string;
  provider_notes?: string;
  services: {
    name: string;
    description: string;
  } | null;
  provider_profiles: {
    business_name?: string;
    rating: number;
    profiles: {
      full_name: string;
      phone_number: string;
    } | null;
  } | null;
}

interface PropertyBooking {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
  total_amount: number;
  monthly_rent: number;
  tenant_notes?: string;
  owner_notes?: string;
  properties: {
    title: string;
    location: string;
    property_type: string;
    bedrooms?: number;
    bathrooms?: number;
  } | null;
}

interface OwnedProperty {
  id: string;
  title: string;
  location: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  // add other fields as needed
}

const UserDashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>([]);
  const [propertyBookings, setPropertyBookings] = useState<PropertyBooking[]>([]);
  const [ownedProperties, setOwnedProperties] = useState<OwnedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalServiceBookings: 0,
    totalPropertyBookings: 0,
    activeServiceBookings: 0,
    activePropertyBookings: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchUserData();
    fetchOwnedProperties(); // fetch owned properties
  }, [user, navigate]);

  const fetchUserData = async () => {
    try {
      // Fetch service bookings
      const { data: serviceData, error: serviceError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (name, description, duration_minutes),
          provider_profiles (
            business_name,
            rating,
            profiles (full_name, phone_number)
          )
        `)
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });

      if (serviceError) throw serviceError;
      setServiceBookings((serviceData as any) || []);

      // Fetch property bookings
      const { data: propertyData, error: propertyError } = await supabase
        .from('property_bookings')
        .select(`
          *,
          properties (
            title,
            location,
            property_type,
            bedrooms,
            bathrooms
          )
        `)
        .eq('tenant_id', user!.id)
        .order('created_at', { ascending: false });

      if (propertyError) throw propertyError;
      setPropertyBookings((propertyData as any) || []);

      // Calculate stats
      const totalServiceBookings = serviceData?.length || 0;
      const totalPropertyBookings = propertyData?.length || 0;
      const activeServiceBookings = serviceData?.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)).length || 0;
      const activePropertyBookings = propertyData?.filter(b => b.status === 'active').length || 0;
      const totalServiceSpent = serviceData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const totalPropertySpent = propertyData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      setStats({
        totalServiceBookings,
        totalPropertyBookings,
        activeServiceBookings,
        activePropertyBookings,
        totalSpent: totalServiceSpent + totalPropertySpent,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnedProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user!.id);

      if (error) throw error;
      setOwnedProperties(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load your properties',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'in_progress': return 'bg-orange-500';
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'expired': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const cancelBooking = async (bookingId: string, type: 'service' | 'property') => {
    try {
      const table = type === 'service' ? 'bookings' : 'property_bookings';
      const { error } = await supabase
        .from(table)
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Booking cancelled successfully',
      });
      
      fetchUserData();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel booking',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {userProfile?.full_name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Bookings</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServiceBookings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Bookings</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPropertyBookings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeServiceBookings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePropertyBookings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalSpent}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Service Bookings</TabsTrigger>
          <TabsTrigger value="properties">Property Bookings</TabsTrigger>
          <TabsTrigger value="owned">My Properties</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Service Bookings</CardTitle>
              <CardDescription>Track your service bookings and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {serviceBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No service bookings yet.</p>
                  <Button onClick={() => navigate('/services')}>
                    Browse Services
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">{booking.services?.name}</h3>
                            <p className="text-muted-foreground">
                              {booking.provider_profiles?.business_name || booking.provider_profiles?.profiles?.full_name}
                            </p>
                            <div className="flex items-center mt-1">
                              <Star className="w-4 h-4 text-yellow-500 mr-1" />
                              <span className="text-sm">{booking.provider_profiles?.rating}/5</span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(booking.booking_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            {booking.booking_time}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            ₹{booking.total_amount}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-2 mt-1" />
                            <span className="text-sm">{booking.customer_address}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {booking.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelBooking(booking.id, 'service')}
                            >
                              Cancel Booking
                            </Button>
                          )}
                          
                          {(['confirmed', 'in_progress'].includes(booking.status)) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/track-booking/${booking.id}`)}
                            >
                              Track Provider
                            </Button>
                          )}
                          
                          {booking.payment_status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/payment?booking_id=${booking.id}&type=service`)}
                            >
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Property Bookings</CardTitle>
              <CardDescription>Your property rental bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {propertyBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No property bookings yet.</p>
                  <Button onClick={() => navigate('/properties')}>
                    Browse Properties
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {propertyBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">{booking.properties?.title}</h3>
                            <p className="text-muted-foreground">{booking.properties?.property_type}</p>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            ₹{booking.monthly_rent}/month
                          </div>
                          <div className="flex items-center">
                            <Home className="w-4 h-4 mr-2" />
                            {booking.properties?.bedrooms}BR/{booking.properties?.bathrooms}BA
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-2 mt-1" />
                            <span className="text-sm">{booking.properties?.location}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {booking.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelBooking(booking.id, 'property')}
                            >
                              Cancel Booking
                            </Button>
                          )}
                          
                          {booking.payment_status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => navigate(`/payment?booking_id=${booking.id}&type=property`)}
                            >
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Properties</CardTitle>
              <CardDescription>Properties you own</CardDescription>
            </CardHeader>
            <CardContent>
              {ownedProperties.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You have not added any properties yet.</p>
                  <Button onClick={() => navigate('/add-property')}>
                    Add Property
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {ownedProperties.map((property) => (
                    <Card key={property.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">{property.title}</h3>
                            <p className="text-muted-foreground">{property.property_type}</p>
                            <div className="flex items-center mt-1">
                              <Home className="w-4 h-4 mr-1" />
                              <span className="text-sm">{property.bedrooms}BR/{property.bathrooms}BA</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="text-sm">{property.location}</span>
                            </div>
                          </div>
                          {/* Add edit/delete buttons if needed */}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <p><strong>Name:</strong> {userProfile?.full_name || 'Not set'}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Phone:</strong> {userProfile?.phone_number || 'Not set'}</p>
                  <p><strong>User Type:</strong> {userProfile?.user_type}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Account Statistics</h3>
                  <p><strong>Total Service Bookings:</strong> {stats.totalServiceBookings}</p>
                  <p><strong>Total Property Bookings:</strong> {stats.totalPropertyBookings}</p>
                  <p><strong>Total Amount Spent:</strong> ₹{stats.totalSpent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDashboard;
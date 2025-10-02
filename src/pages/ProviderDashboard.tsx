import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, DollarSign, Clock, User, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Booking {
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
  profiles: {
    full_name: string;
    phone_number: string;
  } | null;
}

interface ProviderProfile {
  id: string;
  business_name?: string;
  description?: string;
  experience_years?: number;
  rating: number;
  total_bookings: number;
  is_verified: boolean;
  is_available: boolean;
  pan_card_number?: string;
  pan_verification_status?: string;
}

const ProviderDashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (!user || userProfile?.user_type !== 'provider') {
      navigate('/auth');
      return;
    }
    fetchProviderData();
  }, [user, userProfile, navigate]);

  const fetchProviderData = async () => {
    try {
      // Fetch provider profile
      const { data: profile, error: profileError } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      console.log('Provider profile fetch result:', { profile, profileError });

      if (profileError) {
        console.error('Provider profile error:', profileError);
        throw profileError;
      }

      if (!profile) {
        console.log('No provider profile found - user needs to complete setup');
        setProviderProfile(null);
        setLoading(false);
        return;
      }

      setProviderProfile(profile);

      // Fetch bookings
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          services:service_id (name, description),
          profiles:customer_id (full_name, phone_number)
        `)
        .eq('provider_id', profile.id)
        .order('created_at', { ascending: false });

      if (bookingError) throw bookingError;
      setBookings((bookingData as any) || []);

      // Calculate stats
      const totalBookings = bookingData?.length || 0;
      const pendingBookings = bookingData?.filter(b => b.status === 'pending').length || 0;
      const completedBookings = bookingData?.filter(b => b.status === 'completed').length || 0;
      const totalEarnings = bookingData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      setStats({
        totalBookings,
        pendingBookings,
        completedBookings,
        totalEarnings,
      });
    } catch (error) {
      console.error('Error fetching provider data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Booking status updated successfully',
      });
      
      fetchProviderData();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Error',
        description: 'Failed to update booking status',
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
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (!providerProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Complete Your Provider Profile</CardTitle>
            <CardDescription>
              You need to complete your provider profile to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => {
              console.log('Navigating to provider registration...');
              navigate('/provider-registration');
            }}>
              Complete Provider Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Provider Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {providerProfile.business_name || userProfile?.full_name}
        </p>
        <Button
          className="mt-4"
          onClick={() => navigate('/manage-properties')}
        >
          Add Property
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedBookings}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalEarnings}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Manage your service bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No bookings yet. Start by making your services available!
                </p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">{booking.services?.name}</h3>
                            <p className="text-muted-foreground">
                              {booking.profiles?.full_name} • {booking.profiles?.phone_number}
                            </p>
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
                        
                        {booking.customer_notes && (
                          <div className="mb-4">
                            <p className="text-sm text-muted-foreground">
                              <strong>Customer Notes:</strong> {booking.customer_notes}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              >
                                Decline
                              </Button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                            >
                              Start Service
                            </Button>
                          )}
                          {booking.status === 'in_progress' && (
                            <Button
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, 'completed')}
                            >
                              Mark Complete
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

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Profile</CardTitle>
              <CardDescription>Your professional information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Business Information</h3>
                  <p><strong>Business Name:</strong> {providerProfile.business_name || 'Not set'}</p>
                  <p><strong>Experience:</strong> {providerProfile.experience_years || 0} years</p>
                  <p><strong>Rating:</strong> {providerProfile.rating}/5 ⭐</p>
                  <p><strong>Total Bookings:</strong> {providerProfile.total_bookings}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Verification Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span>Profile Verified:</span>
                      {providerProfile.is_verified ? 
                        <Badge className="bg-green-500">Verified</Badge> : 
                        <Badge className="bg-red-500">Not Verified</Badge>
                      }
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span>PAN Verification:</span>
                      {getVerificationBadge(providerProfile.pan_verification_status)}
                    </div>
                    
                    {providerProfile.pan_card_number && (
                      <p><strong>PAN Number:</strong> {providerProfile.pan_card_number}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {providerProfile.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{providerProfile.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderDashboard;
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, DollarSign, Clock, User, Wrench, AlertCircle, CheckCircle, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface UnassignedBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  payment_status: string;
  total_amount: number;
  customer_address: string;
  customer_notes?: string;
  services: {
    name: string;
    description: string;
  } | null;
  profiles: {
    full_name: string;
    phone_number: string;
  } | null;
}

interface Provider {
  id: string;
  business_name?: string;
  profiles: {
    full_name: string;
  } | null;
}

interface PendingAdminRequest {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  email: string;
  status: string;
  created_at: string;
}

const Admin = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [unassignedBookings, setUnassignedBookings] = useState<UnassignedBooking[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingAdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (!user || userProfile?.user_type !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, userProfile, navigate]);

  const fetchData = async () => {
    try {
      // Fetch unassigned bookings
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (name, description),
          profiles:customer_id (full_name, phone_number)
        `)
        .is('provider_id', null)
        .order('created_at', { ascending: false });

      if (bookingError) throw bookingError;
      setUnassignedBookings(bookingData || []);

      // Fetch all providers
      const { data: providerData, error: providerError } = await supabase
        .from('provider_profiles')
        .select(`
          id,
          business_name,
          profiles:user_id (full_name)
        `);

      if (providerError) throw providerError;
      setProviders(providerData || []);

      // Fetch pending admin requests
      const { data: requestData, error: requestError } = await (supabase as any)
        .from('pending_admin_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestError) throw requestError;
      setPendingRequests(requestData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const assignProvider = async (bookingId: string, providerId: string) => {
    setAssigning(bookingId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ provider_id: providerId })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Provider assigned successfully',
      });

      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error assigning provider:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign provider',
        variant: 'destructive',
      });
    } finally {
      setAssigning(null);
    }
  };

  const approveAdminRequest = async (requestId: string, userId: string) => {
    setProcessingRequest(requestId);
    try {
      // Update the request status
      const { error: requestError } = await (supabase as any)
        .from('pending_admin_requests')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Update the user's profile to admin
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ user_type: 'admin' })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      toast({
        title: 'Success',
        description: 'Admin request approved successfully',
      });

      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error approving admin request:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve admin request',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const rejectAdminRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const { error } = await (supabase as any)
        .from('pending_admin_requests')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Admin request rejected',
      });

      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting admin request:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject admin request',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  if (!user || userProfile?.user_type !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage service bookings and provider assignments
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Unassigned Service Bookings
          </CardTitle>
          <CardDescription>
            Bookings that need provider assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unassignedBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No unassigned bookings.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unassignedBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{booking.services?.name}</h3>
                        <p className="text-muted-foreground">
                          Customer: {booking.profiles?.full_name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {booking.status}
                        </Badge>
                        <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                          {booking.payment_status}
                        </Badge>
                      </div>
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
                          <strong>Notes:</strong> {booking.customer_notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Select
                        onValueChange={(providerId) => assignProvider(booking.id, providerId)}
                        disabled={assigning === booking.id}
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.business_name || provider.profiles?.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {assigning === booking.id && (
                        <span className="text-sm text-muted-foreground">Assigning...</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Pending Admin Requests
          </CardTitle>
          <CardDescription>
            Users requesting admin access approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pending admin requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{request.full_name}</h3>
                        <p className="text-muted-foreground">{request.email}</p>
                      </div>
                      <Badge variant="outline">
                        {request.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center">
                        <Wrench className="w-4 h-4 mr-2" />
                        {request.phone_number}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => approveAdminRequest(request.id, request.user_id)}
                        disabled={processingRequest === request.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => rejectAdminRequest(request.id)}
                        disabled={processingRequest === request.id}
                        variant="destructive"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      {processingRequest === request.id && (
                        <span className="text-sm text-muted-foreground">Processing...</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;

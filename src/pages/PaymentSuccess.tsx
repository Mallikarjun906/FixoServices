import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("booking");
  const payLater = searchParams.get("payLater");

  useEffect(() => {
    if (sessionId) {
      updateBookingStatus();
    } else if (payLater === "true" && bookingId) {
      fetchPayLaterBooking();
    }
  }, [sessionId, payLater, bookingId]);

  const updateBookingStatus = async () => {
    try {
      // Find booking by session_id (stored in payment_id)
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (name, description),
          provider_profiles (business_name)
        `)
        .eq('payment_id', sessionId)
        .maybeSingle();

      if (bookingError) throw bookingError;

      if (bookingData) {
        // Update payment status to paid
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            payment_status: 'paid',
            status: 'confirmed' 
          })
          .eq('id', bookingData.id);

        if (updateError) throw updateError;

        setBooking({ ...bookingData, payment_status: 'paid', status: 'confirmed' });
        
        toast({
          title: "Payment Successful!",
          description: "Your booking has been confirmed and payment processed.",
        });
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Payment was successful but we couldn't update your booking status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPayLaterBooking = async () => {
    setLoading(true);
    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (name, description),
          provider_profiles (business_name)
        `)
        .eq('id', bookingId)
        .maybeSingle();

      if (bookingError || !bookingData) throw bookingError || new Error("Booking not found");

      setBooking(bookingData);

      toast({
        title: "Booking Confirmed!",
        description: "Your booking is confirmed. You can pay after the service is completed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch your booking details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Processing payment...</h2>
          <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600">
              {payLater === "true" ? "Booking Confirmed!" : "Payment Successful!"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              {payLater === "true"
                ? "Your booking is confirmed. You can pay after the service is completed."
                : "Your payment has been processed successfully and your booking is now confirmed."
              }
            </p>

            {booking && (
              <div className="bg-muted/50 p-4 rounded-lg text-left">
                <h3 className="font-semibold mb-3">Booking Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span>{booking.services?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <span>{booking.provider_profiles?.business_name ?? "Provider will be assigned"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time:</span>
                    <span>{booking.booking_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>₹{booking.total_amount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status:</span>
                    <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={() => navigate(`/track-booking/${booking?.id}`)}
                className="w-full"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Track Your Service
              </Button>
              
              <Button 
                onClick={() => navigate('/bookings')}
                variant="outline"
                className="w-full"
              >
                View All Bookings
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              {sessionId && <p>Session ID: {sessionId}</p>}
              <p>You will receive a confirmation email shortly.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
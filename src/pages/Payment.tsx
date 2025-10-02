import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CreditCard, Wallet, Building, Shield, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [booking, setBooking] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [loading, setLoading] = useState(false);
  const bookingId = searchParams.get("booking");
  const serviceId = searchParams.get("service");
  const payLater = searchParams.get("payLater");

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    } else if (serviceId) {
      fetchService();
    }
    
    // Set default payment method based on URL parameter
    if (payLater === "true") {
      setPaymentMethod("pay_later");
    }
  }, [bookingId, serviceId, payLater]);

  const fetchBooking = async () => {
    if (!bookingId) return;
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load booking details",
        variant: "destructive",
      });
      return;
    }

    setBooking(data);
  };

  const fetchService = async () => {
    if (!serviceId) return;
    
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_categories (
          name
        )
      `)
      .eq('id', serviceId)
      .eq('is_active', true)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load service details",
        variant: "destructive",
      });
      navigate('/services');
      return;
    }

    setService(data);
  };

  const handlePayment = async () => {
    if ((!booking && !service) || !user) return;
    
    setLoading(true);
    
    try {
      // Handle "Pay After Service" option
      if (paymentMethod === "pay_later") {
        if (service && !booking) {
          // Create new booking with pay after service option
          setLoading(true);
          try {
            const { data: newBooking, error: bookingError } = await supabase
              .from('bookings')
              .insert({
                customer_id: user.id,
                service_id: service.id,
                provider_id: null,
                booking_date: new Date().toISOString().split('T')[0],
                booking_time: '09:00',
                customer_address: 'To be updated',
                total_amount: service.base_price,
                status: 'confirmed', // <-- Ensure status is confirmed
                payment_status: 'pay_after_service',
              })
              .select()
              .single();

            if (bookingError || !newBooking) {
              toast({
                title: "Booking Error",
                description: bookingError?.message || "Failed to create booking.",
                variant: "destructive",
              });
              setLoading(false);
              return;
            }

            toast({
              title: "Booking Confirmed!",
              description: "Your service booking has been confirmed. You can pay after the service is completed.",
            });

            navigate('/my-bookings');
            return;
          } catch (err) {
            toast({
              title: "Booking Error",
              description: err instanceof Error ? err.message : "Unknown error occurred.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        } else if (booking) {
          // Update existing booking to pay after service
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ 
              payment_status: 'pay_after_service',
              status: 'confirmed'
            })
            .eq('id', booking.id);

          if (updateError) {
            toast({
              title: "Booking Update Error",
              description: updateError.message,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }

          toast({
            title: "Payment Option Updated!",
            description: "You can now pay after the service is completed.",
          });

          navigate('/my-bookings');
          return;
        }
      }

      // If paying for a service (new booking), create booking first
      if (service && !booking) {
        console.log("Creating new booking for service:", service.name);
        const { data: newBooking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            customer_id: user.id,
            service_id: service.id,
            provider_id: null, // Will be assigned manually later
            booking_date: new Date().toISOString().split('T')[0], // Default to today
            booking_time: '09:00', // Default time
            customer_address: 'To be updated', // Will be collected later
            total_amount: service.base_price,
            status: 'payment_pending',
            payment_status: 'processing',
          })
          .select()
          .single();

        if (bookingError) {
          console.error("Booking creation error:", bookingError);
          throw new Error(`Failed to create booking: ${bookingError.message}`);
        }
        
        console.log("Booking created:", newBooking.id);
        
        // Create checkout session for the new booking
        console.log("Calling create-checkout function...");
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            bookingId: newBooking.id,
            amount: service.base_price,
            serviceName: service.name,
            customerEmail: user.email,
          },
        });

        console.log("Checkout response:", { data, error });
        
        if (error) {
          console.error("Checkout function error:", error);
          throw new Error(`Payment setup failed: ${error.message}`);
        }
        if (!data?.url || !data?.id) {
          console.error("Invalid checkout session response:", data);
          throw new Error('Invalid checkout session response');
        }

        console.log("Updating booking with payment ID:", data.id);
        // Update booking with payment intent
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            payment_id: data.id,
            payment_status: 'processing' 
          })
          .eq('id', newBooking.id);

        if (updateError) {
          console.error("Booking update error:", updateError);
          // Don't throw here as payment session is already created
        }

        console.log("Redirecting to Stripe checkout:", data.url);
        // Redirect to Stripe Checkout
        window.location.href = data.url;
        
      } else if (booking) {
        console.log("Processing payment for existing booking:", booking.id);
        // Existing booking payment flow
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: {
            bookingId: booking.id,
            amount: booking.total_amount,
            serviceName: booking?.services?.name ?? 'Service',
            customerEmail: user.email,
          },
        });

        console.log("Checkout response:", { data, error });

        if (error) {
          console.error("Checkout function error:", error);
          throw new Error(`Payment setup failed: ${error.message}`);
        }
        if (!data?.url || !data?.id) {
          console.error("Invalid checkout session response:", data);
          throw new Error('Invalid checkout session response');
        }

        // Update booking with payment intent
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ 
            payment_id: data.id,
            payment_status: 'processing' 
          })
          .eq('id', booking.id);

        if (updateError) {
          console.error("Booking update error:", updateError);
          // Don't throw here as payment session is already created
        }

        console.log("Redirecting to Stripe checkout:", data.url);
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      }
      
    } catch (error) {
      console.error("Payment handler error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Payment Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: "stripe",
      name: "Credit/Debit Card",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Pay securely with your card via Stripe"
    },
    {
      id: "wallet",
      name: "Digital Wallet",
      icon: <Wallet className="h-5 w-5" />,
      description: "Apple Pay, Google Pay, PayPal"
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: <Building className="h-5 w-5" />,
      description: "Direct bank transfer (ACH)"
    },
    {
      id: "pay_later",
      name: "Pay After Service",
      icon: <CheckCircle className="h-5 w-5" />,
      description: "Book now, pay after service completion"
    }
  ];

  if (!booking && !service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading payment details...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your information.</p>
        </div>
      </div>
    );
  }

  const paymentData = booking || service;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Complete Payment</h1>
            <p className="text-muted-foreground">
              {booking ? `Booking ID: ${booking.id.slice(0, 8)}...` : `Service: ${service?.name}`}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={paymentMethod} 
                  onValueChange={setPaymentMethod}
                  className="space-y-4"
                >
                  {paymentMethods.map((method) => (
                    <div key={method.id}>
                      <Label 
                        htmlFor={method.id}
                        className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent"
                      >
                        <RadioGroupItem value={method.id} id={method.id} />
                        <div className="text-primary">{method.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {method.description}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {paymentMethod === "stripe" && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Shield className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium">Secure Payment</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your payment information is encrypted and secure. We never store your card details.
                    </p>
                  </div>
                )}
                
                {paymentMethod === "pay_later" && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium">Pay After Service</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your booking will be confirmed immediately. You can pay after the service is completed to your satisfaction.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <Shield className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Payment Security</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 256-bit SSL encryption</li>
                      <li>• PCI DSS compliant</li>
                      <li>• No card details stored</li>
                      <li>• Fraud protection</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{service ? 'Service Summary' : 'Booking Summary'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">
                    {service?.name ?? booking?.services?.name ?? 'Selected Service'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {service ? 
                      `Category: ${service.service_categories?.name}` : 
                      (booking?.provider_profiles?.business_name ?? 'Provider will be assigned after payment')
                    }
                  </p>
                </div>
                
                {booking && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Date:</span>
                      <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Time:</span>
                      <span>{booking.booking_time}</span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between text-sm">
                  <span>Duration:</span>
                  <span>
                    {service ? 
                      `${service.duration_minutes} minutes` : 
                      (booking?.services?.duration_minutes ? `${booking.services.duration_minutes} minutes` : '-')
                    }
                  </span>
                </div>

                <Separator />
                
                <div className="flex justify-between text-sm">
                  <span>Service Fee:</span>
                  <span>₹{service?.base_price ?? booking?.services?.base_price ?? booking?.total_amount}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Platform Fee:</span>
                  <span>₹29</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₹{service ? (service.base_price + 29) : booking?.total_amount}</span>
                </div>
                
                {service && (
                  <Badge variant="outline" className="w-full justify-center">
                    Provider will be assigned after payment
                  </Badge>
                )}
                
                {booking && (
                  <Badge variant="secondary" className="w-full justify-center">
                    {booking.status === 'confirmed' ? 'Confirmed' : 'Pending Confirmation'}
                  </Badge>
                )}
                
                <Button 
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    "Processing..."
                  ) : paymentMethod === "pay_later" ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirm Booking (Pay Later)
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Pay ₹{service ? (service.base_price + 29) : booking?.total_amount}
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  By clicking "Pay", you agree to our Terms of Service and Privacy Policy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
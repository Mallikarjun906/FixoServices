import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description: string;
  base_price: number;
  duration_minutes: number;
  image_url: string;
  service_categories: {
    name: string;
  };
}

const bookingSchema = z.object({
  customerAddress: z.string().min(10, "Address must be at least 10 characters"),
  customerNotes: z.string().optional(),
  bookingDate: z.date().refine((date) => date !== undefined, {
    message: "Please select a date",
  }),
  bookingTime: z.string().min(1, "Please select a time"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const BookService = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerAddress: "",
      customerNotes: "",
      bookingTime: "",
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signin');
      return;
    }
    if (serviceId) {
      fetchService();
    }
  }, [serviceId, user, navigate]);

  const fetchService = async () => {
    try {
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

      if (error) throw error;
      setService(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch service details",
        variant: "destructive",
      });
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!user || !service) return;

    setSubmitting(true);
    try {
      // Find available providers for this service
      const { data: providerServices, error: providerError } = await supabase
        .from('provider_services')
        .select('provider_id')
        .eq('service_id', serviceId)
        .eq('is_active', true);

      if (providerError) throw providerError;

      let providerId = null;
      let toastMessage = "Your service booking has been confirmed. You will receive a confirmation shortly.";
      let toastTitle = "Booking Confirmed!";

      if (providerServices?.length) {
        // Assign to the first available provider
        providerId = providerServices[0].provider_id;
      } else {
        toastTitle = "Booking Created";
        toastMessage = "Your booking has been created successfully. A provider will be assigned to you shortly.";
      }

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: user.id,
          service_id: serviceId!,
          provider_id: providerId,
          booking_date: format(data.bookingDate, 'yyyy-MM-dd'),
          booking_time: data.bookingTime,
          customer_address: data.customerAddress,
          customer_notes: data.customerNotes || null,
          total_amount: service.base_price,
          status: 'pending',
          payment_status: 'pending',
        });

      if (bookingError) throw bookingError;

      toast({
        title: toastTitle,
        description: toastMessage,
      });

      navigate('/bookings');
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Failed to book the service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30"
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Service not found</h1>
          <Button onClick={() => navigate('/services')}>
            Browse Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book Service</h1>
          <p className="text-muted-foreground">
            Fill in the details below to book your service
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="text-2xl">🔧</div>
                {service.name}
              </CardTitle>
              <CardDescription>
                {service.service_categories.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {service.description}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Duration: {service.duration_minutes} minutes
                </div>
                <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <span>₹{service.base_price}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="bookingDate">Preferred Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("bookingDate") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("bookingDate") ? (
                          format(form.watch("bookingDate"), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("bookingDate")}
                        onSelect={(date) => form.setValue("bookingDate", date!)}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.bookingDate && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.bookingDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bookingTime">Preferred Time</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={form.watch("bookingTime") === time ? "default" : "outline"}
                        className="text-xs"
                        onClick={() => form.setValue("bookingTime", time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                  {form.formState.errors.bookingTime && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.bookingTime.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerAddress">Service Address</Label>
                  <Textarea
                    id="customerAddress"
                    placeholder="Enter the complete address where service is needed"
                    {...form.register("customerAddress")}
                    className="min-h-[80px]"
                  />
                  {form.formState.errors.customerAddress && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.customerAddress.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerNotes">Special Instructions (Optional)</Label>
                  <Textarea
                    id="customerNotes"
                    placeholder="Any special instructions or requirements..."
                    {...form.register("customerNotes")}
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-xl font-bold text-primary">
                      ₹{service.base_price}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Booking..." : "Book & Pay Now"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full" 
                      disabled={submitting}
                      onClick={() => navigate(`/payment?service=${service.id}&payLater=true`)}
                    >
                      Book & Pay Later
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookService;
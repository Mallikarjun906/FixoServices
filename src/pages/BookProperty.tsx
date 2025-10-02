import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Bed, Bath, Square } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Property {
  id: string;
  title: string;
  description: string;
  property_type: 'home' | 'shop' | 'PG';
  location: string;
  monthly_rent: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  images: string[];
  owner_id: string;
}

const BookProperty = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    tenantNotes: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchProperty();
    }
  }, [id, user]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProperty(data as Property);
    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        title: "Error",
        description: "Failed to load property details",
        variant: "destructive",
      });
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalAmount = () => {
    if (!property || !formData.startDate || !formData.endDate) return 0;
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const monthsDifference = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    return Math.max(1, monthsDifference) * property.monthly_rent;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !property) return;

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const today = new Date();
    
    if (startDate < today) {
      toast({
        title: "Invalid Date",
        description: "Start date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    if (endDate <= startDate) {
      toast({
        title: "Invalid Date",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const totalAmount = calculateTotalAmount();

      const { error } = await supabase
        .from('property_bookings')
        .insert([{
          property_id: property.id,
          tenant_id: user.id,
          start_date: formData.startDate,
          end_date: formData.endDate,
          monthly_rent: property.monthly_rent,
          total_amount: totalAmount,
          tenant_notes: formData.tenantNotes || null,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property booking request submitted successfully",
      });

      navigate('/my-property-bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading property details...</div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
            <p className="text-muted-foreground">The property you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Book Property</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Property Summary */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{property.title}</CardTitle>
                  <Badge variant={property.property_type === 'home' ? 'default' : 'secondary'}>
                    {property.property_type}
                  </Badge>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.location}
                </div>
              </CardHeader>
              <CardContent>
                {property.images && property.images.length > 0 && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="text-2xl font-bold text-primary mb-4">
                  {formatPrice(property.monthly_rent)}/month
                </div>

                {property.property_type === 'home' && (
                  <div className="flex gap-4 mb-4">
                    {property.bedrooms && (
                      <div className="flex items-center">
                        <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{property.bedrooms} bed</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center">
                        <Bath className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{property.bathrooms} bath</span>
                      </div>
                    )}
                    {property.square_feet && (
                      <div className="flex items-center">
                        <Square className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>{property.square_feet} sqft</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-muted-foreground">{property.description}</p>
              </CardContent>
            </Card>

            {/* Booking Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="tenantNotes">Additional Notes</Label>
                    <Textarea
                      id="tenantNotes"
                      placeholder="Any special requirements or questions..."
                      value={formData.tenantNotes}
                      onChange={(e) => setFormData({ ...formData, tenantNotes: e.target.value })}
                      rows={4}
                    />
                  </div>

                  {formData.startDate && formData.endDate && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Booking Summary</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Monthly Rent:</span>
                          <span>{formatPrice(property.monthly_rent)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{Math.max(1, Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)))} months</span>
                        </div>
                        <div className="flex justify-between font-bold text-primary">
                          <span>Total Amount:</span>
                          <span>{formatPrice(calculateTotalAmount())}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate(`/property/${property.id}`)}
                      className="flex-1"
                    >
                      Back to Property
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting || !formData.startDate || !formData.endDate}
                      className="flex-1"
                    >
                      {submitting ? 'Submitting...' : 'Submit Booking'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookProperty;
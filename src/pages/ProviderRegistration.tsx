import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle } from 'lucide-react';

const providerRegistrationSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  experienceYears: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Experience must be a valid number',
  }),
  panCardNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN card format (e.g., ABCDE1234F)'),
  panCardImage: z.instanceof(File, { message: 'PAN card image is required' }),
});

const ProviderRegistration = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [panImagePreview, setPanImagePreview] = useState<string | null>(null);
  const [existingProviderProfile, setExistingProviderProfile] = useState<any>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const form = useForm({
    resolver: zodResolver(providerRegistrationSchema),
    defaultValues: {
      businessName: '',
      description: '',
      experienceYears: '0',
      panCardNumber: '',
    },
  });

  useEffect(() => {
    const checkExistingProviderProfile = async () => {
      if (!user) return;
      
      try {
        const { data: providerProfile, error } = await supabase
          .from('provider_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking provider profile:', error);
        } else {
          setExistingProviderProfile(providerProfile);
        }
      } catch (error) {
        console.error('Error checking provider profile:', error);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkExistingProviderProfile();
  }, [user]);

  const handlePanImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('panCardImage', file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPanImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof providerRegistrationSchema>) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to register as a provider',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Upload PAN card image
      const fileExt = values.panCardImage.name.split('.').pop();
      const fileName = `${user.id}-pan-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(`pan-cards/${fileName}`, values.panCardImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(`pan-cards/${fileName}`);

      // Create provider profile
      const { error: profileError } = await supabase
        .from('provider_profiles')
        .insert({
          user_id: user.id,
          business_name: values.businessName,
          description: values.description,
          experience_years: parseInt(values.experienceYears),
          pan_card_number: values.panCardNumber,
          pan_card_image_url: publicUrl,
          pan_verification_status: 'pending',
        });

      if (profileError) throw profileError;

      // Update user profile to provider type
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ user_type: 'provider' })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Provider registration completed! Your PAN card is being verified.',
      });

      navigate('/provider-dashboard');
    } catch (error) {
      console.error('Error registering provider:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete registration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to register as a provider</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkingProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Checking your registration status</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (existingProviderProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Already Registered</CardTitle>
            <CardDescription>You are already registered as a provider</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/provider-dashboard')}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Complete Provider Registration</CardTitle>
            <CardDescription>
              Fill in your professional details and upload your PAN card for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    {...form.register('businessName')}
                    placeholder="Enter your business name"
                  />
                  {form.formState.errors.businessName && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.businessName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="experienceYears">Years of Experience *</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    min="0"
                    {...form.register('experienceYears')}
                    placeholder="0"
                  />
                  {form.formState.errors.experienceYears && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.experienceYears.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Business Description *</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Describe your services and expertise..."
                  rows={4}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="panCardNumber">PAN Card Number *</Label>
                <Input
                  id="panCardNumber"
                  {...form.register('panCardNumber')}
                  placeholder="ABCDE1234F"
                  className="uppercase"
                  maxLength={10}
                />
                {form.formState.errors.panCardNumber && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.panCardNumber.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="panCardImage">PAN Card Image *</Label>
                <div className="mt-2">
                  <input
                    id="panCardImage"
                    type="file"
                    accept="image/*"
                    onChange={handlePanImageChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => document.getElementById('panCardImage')?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-primary transition-colors"
                  >
                    {panImagePreview ? (
                      <div className="text-center">
                        <img
                          src={panImagePreview}
                          alt="PAN Card Preview"
                          className="mx-auto max-h-48 rounded-lg mb-2"
                        />
                        <div className="flex items-center justify-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm">PAN card uploaded</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload your PAN card image
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {form.formState.errors.panCardImage && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.panCardImage.message}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Verification Process</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Your PAN card will be verified within 24-48 hours. You'll receive an email
                      notification once the verification is complete. Verified providers get
                      priority in search results and customer trust.
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Registering...' : 'Complete Registration'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderRegistration;
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench } from "lucide-react";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  fullName: z.string().min(2, "Full name is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  userType: z.enum(["customer", "provider", "admin"]).refine((val) => val, {
    message: "Please select a user type",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'signin' | 'signup'>(
    (searchParams.get('mode') as 'signin' | 'signup') || 'signin'
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phoneNumber: "",
      userType: "customer" as const,
    },
  });

  const onSignIn = async (values: z.infer<typeof signInSchema>) => {
    setLoading(true);
    try {
      const { error } = await signIn(values.email, values.password);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Signed in successfully!",
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setLoading(true);
    try {
      const userType = values.userType === 'admin' ? 'pending_admin' : values.userType;
      const { error } = await signUp(values.email, values.password, {
        full_name: values.fullName,
        phone_number: values.phoneNumber,
        user_type: userType,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        if (values.userType === 'admin') {
          // Insert into pending_admin_requests
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { error: insertError } = await (supabase as any)
              .from('pending_admin_requests')
              .insert({
                user_id: userData.user.id,
                full_name: values.fullName,
                phone_number: values.phoneNumber,
                email: values.email,
              });

            if (insertError) {
              console.error('Error inserting pending admin request:', insertError);
              toast({
                title: "Warning",
                description: "Account created but admin request submission failed. Please contact support.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Admin Request Submitted",
                description: "Your admin registration request has been submitted. You'll be notified once approved by existing admins.",
              });
            }
          }
          setMode('signin');
        } else if (values.userType === 'provider') {
          toast({
            title: "Provider Registration Required",
            description: "Please complete your provider registration with PAN card verification.",
          });
          navigate('/provider-registration');
        } else {
          toast({
            title: "Success",
            description: "Account created successfully! Please check your email to verify your account.",
          });
          setMode('signin');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Wrench className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Fixo</span>
          </div>
          <CardTitle>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</CardTitle>
          <CardDescription>
            {mode === 'signin' 
              ? 'Welcome back! Please sign in to your account.' 
              : 'Create a new account to get started with Fixo.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'signin' ? (
            <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...signInForm.register("email")}
                  placeholder="Enter your email"
                />
                {signInForm.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {signInForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...signInForm.register("password")}
                  placeholder="Enter your password"
                />
                {signInForm.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {signInForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          ) : (
            <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  {...signUpForm.register("fullName")}
                  placeholder="Enter your full name"
                />
                {signUpForm.formState.errors.fullName && (
                  <p className="text-sm text-destructive mt-1">
                    {signUpForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...signUpForm.register("email")}
                  placeholder="Enter your email"
                />
                {signUpForm.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {signUpForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  {...signUpForm.register("phoneNumber")}
                  placeholder="Enter your phone number"
                />
                {signUpForm.formState.errors.phoneNumber && (
                  <p className="text-sm text-destructive mt-1">
                    {signUpForm.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>
                <div>
                  <Label htmlFor="userType">I want to</Label>
                  <Select onValueChange={(value) => signUpForm.setValue("userType", value as "customer" | "provider" | "admin")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Book Services (Customer)</SelectItem>
                      <SelectItem value="provider">Provide Services (Service Provider)</SelectItem>
                      <SelectItem value="admin">Register as Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {signUpForm.formState.errors.userType && (
                    <p className="text-sm text-destructive mt-1">
                      {signUpForm.formState.errors.userType.message}
                    </p>
                  )}
                  {signUpForm.watch('userType') === 'provider' && (
                    <p className="text-xs text-blue-600 mt-1">
                      After signup, you'll need to complete provider registration with PAN card verification
                    </p>
                  )}
                  {signUpForm.watch('userType') === 'admin' && (
                    <p className="text-xs text-orange-600 mt-1">
                      Admin registration requires approval from existing admins. You'll be notified once approved.
                    </p>
                  )}
                </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...signUpForm.register("password")}
                  placeholder="Create a password"
                />
                {signUpForm.formState.errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {signUpForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...signUpForm.register("confirmPassword")}
                  placeholder="Confirm your password"
                />
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {signUpForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          )}
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm"
            >
              {mode === 'signin' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
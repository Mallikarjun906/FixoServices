import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, Shield, Star, Wrench } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <CheckCircle className="h-6 w-6 text-accent" />,
      title: "Verified Professionals",
      description: "All service providers are background-checked and verified"
    },
    {
      icon: <Clock className="h-6 w-6 text-accent" />,
      title: "Quick Booking",
      description: "Book services in minutes with flexible scheduling"
    },
    {
      icon: <Shield className="h-6 w-6 text-accent" />,
      title: "Secure Payments",
      description: "Safe and secure payment processing with multiple options"
    },
    {
      icon: <Star className="h-6 w-6 text-accent" />,
      title: "Quality Guaranteed",
      description: "100% satisfaction guarantee on all services"
    }
  ];

  const services = [
    { name: "Home Cleaning", icon: "🧹", price: "Starting at ₹299", comingSoon: true },
    { name: "Plumbing", icon: "🔧", price: "Starting at ₹199" },
    { name: "Electrical Work", icon: "⚡", price: "Starting at ₹249" },
    { name: "AC Repair", icon: "❄️", price: "Starting at ₹399", comingSoon: true },
    { name: "Appliance Repair", icon: "🔨", price: "Starting at ₹299", comingSoon: true },
    { name: "Painting", icon: "🎨", price: "Starting at ₹149", comingSoon: true }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Wrench className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold text-primary">Fixo</h1>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Your Trusted Home Service Platform
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Book verified professionals for all your home service needs. 
            From cleaning to repairs, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link to="/services">
                <Button size="lg" className="text-lg px-8 py-6">
                  Browse Services
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="text-lg px-8 py-6">
                    Get Started
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                    Browse Services
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Popular Services</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {services.map((service, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="text-4xl mb-2">{service.icon}</div>
                  <h4 className="font-semibold mb-1">
                    {service.name}
                    {service.comingSoon && (
                      <span className="ml-2 text-lg font-bold text-orange-500">Coming Soon</span>
                    )}
                  </h4>
                  <p className="text-sm text-muted-foreground">{service.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/services">
              <Button variant="outline" size="lg">View All Services</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose Fixo?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied customers who trust Fixo for their home service needs.
          </p>
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?mode=signup&userType=customer">
                <Button variant="secondary" size="lg" className="text-lg px-8 py-6">
                  Book a Service
                </Button>
              </Link>
              <Link to="/auth?mode=signup&userType=provider">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Become a Provider
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;

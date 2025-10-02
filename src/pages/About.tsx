import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Users, Clock, Shield, Star, Wrench } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: <CheckCircle className="h-6 w-6" />,
      title: "Verified Professionals",
      description: "All service providers are thoroughly vetted and verified"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "24/7 Support",
      description: "Round-the-clock customer support for all your needs"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Payments",
      description: "Safe and secure payment processing with multiple options"
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: "Quality Assurance",
      description: "100% satisfaction guarantee on all services"
    }
  ];

  const stats = [
    { number: "100", label: "Happy Customers" },
    { number: "10", label: "Service Providers" },
    { number: "50+", label: "Cities" },
    { number: "99%", label: "Satisfaction Rate" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center items-center mb-6">
              <Wrench className="h-16 w-16 text-primary mr-4" />
              <h1 className="text-5xl font-bold text-foreground">About Fixo</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8">
              Your trusted platform for connecting with professional service providers. 
              We make home services simple, reliable, and affordable.
            </p>
            <Badge variant="secondary" className="text-lg py-2 px-4">
              Serving customers since 2024
            </Badge>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-muted-foreground mb-6">
                Fixo was born from a simple idea: home services should be reliable, 
                transparent, and hassle-free. We noticed that finding trustworthy 
                professionals for home repairs and maintenance was often frustrating 
                and time-consuming.
              </p>
              <p className="text-muted-foreground mb-6">
                Our mission is to bridge the gap between skilled service providers 
                and customers who need their expertise. We've built a platform that 
                ensures quality, reliability, and fair pricing for everyone.
              </p>
              <p className="text-muted-foreground">
                Today, we're proud to serve thousands of customers across multiple 
                cities, connecting them with verified professionals who deliver 
                exceptional service every time.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose Fixo?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're committed to providing the best service experience for both 
              customers and service providers.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    <div className="text-primary">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  Trust & Transparency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We believe in building trust through transparency. Every service 
                  provider is verified, and every transaction is secure and documented.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-primary" />
                  Quality Excellence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We maintain the highest standards by working only with skilled 
                  professionals and continuously monitoring service quality.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                  Customer First
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your satisfaction is our priority. We're committed to ensuring 
                  every interaction exceeds your expectations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Phone,
  Mail,
  Calendar,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface Property {
  id: string;
  title: string;
  description: string;
  property_type: "home" | "shop";
  location: string;
  monthly_rent: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  amenities?: string[];
  images: string[];
  contact_phone?: string;
  contact_email?: string;
  is_available: boolean;
  created_at: string;
  owner_id: string;
}

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProperty(data as Property);
    } catch (error) {
      console.error("Error fetching property:", error);
      toast({
        title: "Error",
        description: "Failed to load property details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
            <p className="text-muted-foreground">
              The property you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}

            <div className="mb-6">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4 flex items-center justify-center">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[currentImageIndex]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                    No Image
                  </div>
                )}
              </div>

              {property.images && property.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {property.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                        currentImageIndex === index
                          ? "border-primary"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${property.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl">{property.title}</CardTitle>
                  <Badge
                    variant={
                      property.property_type === "home"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {property.property_type}
                  </Badge>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  {property.location}
                </div>
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(property.monthly_rent)}/month
                </div>
              </CardHeader>
              <CardContent>
                {property.property_type === "home" && (
                  <div className="flex gap-6 mb-6">
                    {property.bedrooms && (
                      <div className="flex items-center">
                        <Bed className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span>{property.bedrooms} Bedrooms</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex items-center">
                        <Bath className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span>{property.bathrooms} Bathrooms</span>
                      </div>
                    )}
                    {property.square_feet && (
                      <div className="flex items-center">
                        <Square className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span>{property.square_feet} sqft</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description}
                  </p>
                </div>

                {property.amenities && property.amenities.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Listed on {formatDate(property.created_at)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Contact Owner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.contact_phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span>{property.contact_phone}</span>
                  </div>
                )}
                {property.contact_email && (
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="break-all">{property.contact_email}</span>
                  </div>
                )}
                <div className="space-y-2 mt-6">
                  {property.contact_phone && (
                    <Button className="w-full" asChild>
                      <a href={`tel:${property.contact_phone}`}>Call Owner</a>
                    </Button>
                  )}
                  {property.contact_phone && (
                    <Button variant="outline" className="w-full" asChild>
                      <a
                        href={`https://wa.me/${property.contact_phone.replace(
                          /\D/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Contact with WhatsApp
                      </a>
                    </Button>
                  )}
                  {/* Removed Book This Property and Send Email buttons */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;

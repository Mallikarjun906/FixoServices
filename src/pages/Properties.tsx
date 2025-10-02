import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Square } from "lucide-react";
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
  images: string[];
  is_available: boolean;
  owner_id: string;
}

const Properties = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState("");
  const [propertyType, setPropertyType] = useState<
    "all" | "home" | "shop" | "pg"
  >("all");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      let query = supabase
        .from("properties")
        .select("*")
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (propertyType !== "all") {
        query = query.eq("property_type", propertyType);
      }

      if (searchLocation) {
        query = query.ilike("location", `%${searchLocation}%`);
      }

      if (minRent) {
        query = query.gte("monthly_rent", parseInt(minRent));
      }

      if (maxRent) {
        query = query.lte("monthly_rent", parseInt(maxRent));
      }

      const { data, error } = await query;

      if (error) throw error;
      setProperties((data || []) as Property[]);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [propertyType, searchLocation, minRent, maxRent]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading properties...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Properties for Rent
          </h1>
          <p className="text-muted-foreground">
            Find your perfect home or shop And PG
          </p>
        </header>

        {/* Filters */}
        <div className="bg-card rounded-lg p-6 mb-8 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <Input
                placeholder="Enter location..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Property Type
              </label>
              <Select
                value={propertyType}
                onValueChange={(value: "all" | "home" | "shop" | "pg") =>
                  setPropertyType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="home">Homes</SelectItem>
                  <SelectItem value="shop">Shops</SelectItem>
                  <SelectItem value="pg">PG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Min Rent</label>
              <Input
                placeholder="0"
                type="number"
                value={minRent}
                onChange={(e) => setMinRent(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Rent</label>
              <Input
                placeholder="5000"
                type="number"
                value={maxRent}
                onChange={(e) => setMaxRent(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link key={property.id} to={`/property/${property.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{property.title}</CardTitle>
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
                  <div className="flex items-center text-muted-foreground text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    {property.location}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(property.monthly_rent)}
                    </span>
                  </div>
                  {property.property_type === "home" && (
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {property.bedrooms && (
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          {property.bedrooms} bed
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center">
                          <Bath className="h-4 w-4 mr-1" />
                          {property.bathrooms} bath
                        </div>
                      )}
                      {property.square_feet && (
                        <div className="flex items-center">
                          <Square className="h-4 w-4 mr-1" />
                          {property.square_feet} sqft
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                    {property.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No properties found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;

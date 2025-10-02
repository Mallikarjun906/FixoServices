import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

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
}

const ManageProperties = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    property_type: "home" as "home" | "shop",
    location: "",
    monthly_rent: "",
    bedrooms: "",
    bathrooms: "",
    square_feet: "",
    amenities: "",
    contact_phone: "",
    contact_email: "",
    is_available: true,
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("owner_id", user?.id)
        .order("created_at", { ascending: false });

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let imageUrls: string[] = editingProperty
        ? [...editingProperty.images]
        : [];
      let propertyId = editingProperty?.id;

      // 1. Insert property first to get ID (if creating)
      if (!editingProperty) {
        const { data, error } = await supabase
          .from("properties")
          .insert([
            {
              title: formData.title,
              description: formData.description,
              property_type: formData.property_type,
              location: formData.location,
              monthly_rent: parseFloat(formData.monthly_rent),
              bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
              bathrooms: formData.bathrooms
                ? parseInt(formData.bathrooms)
                : null,
              square_feet: formData.square_feet
                ? parseInt(formData.square_feet)
                : null,
              amenities: formData.amenities
                ? formData.amenities.split(",").map((a) => a.trim())
                : [],
              contact_phone: formData.contact_phone || null,
              contact_email: formData.contact_email || null,
              is_available: formData.is_available,
              owner_id: user?.id,
              images: [],
            },
          ])
          .select("id")
          .single();

        if (error) throw error;
        propertyId = data.id;
      }

      // 2. Upload images and collect URLs
      if (selectedImages.length > 0 && propertyId) {
        for (const file of selectedImages) {
          const path = `${user?.id}/${propertyId}/${Date.now()}_${file.name}`;
          // Use upsert: true to overwrite if file exists
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("property-images")
              .upload(path, file, { upsert: true });

          if (uploadError) throw uploadError;

          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from("property-images")
            .getPublicUrl(path);

          if (publicUrlData?.publicUrl) {
            imageUrls.push(publicUrlData.publicUrl);
          }
        }
      }

      // 3. Update property with image URLs
      if (propertyId) {
        const updateData: any = {
          title: formData.title,
          description: formData.description,
          property_type: formData.property_type,
          location: formData.location,
          monthly_rent: parseFloat(formData.monthly_rent),
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
          square_feet: formData.square_feet
            ? parseInt(formData.square_feet)
            : null,
          amenities: formData.amenities
            ? formData.amenities.split(",").map((a) => a.trim())
            : [],
          contact_phone: formData.contact_phone || null,
          contact_email: formData.contact_email || null,
          is_available: formData.is_available,
          owner_id: user?.id,
          images: imageUrls,
        };

        await supabase
          .from("properties")
          .update(updateData)
          .eq("id", propertyId);
      }

      toast({
        title: "Success",
        description: `Property ${
          editingProperty ? "updated" : "created"
        } successfully`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchProperties();
    } catch (error) {
      console.error("Error saving property:", error);
      toast({
        title: "Error",
        description: "Failed to save property",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
    setFormData({
      title: property.title,
      description: property.description || "",
      property_type: property.property_type,
      location: property.location,
      monthly_rent: property.monthly_rent.toString(),
      bedrooms: property.bedrooms?.toString() || "",
      bathrooms: property.bathrooms?.toString() || "",
      square_feet: property.square_feet?.toString() || "",
      amenities: property.amenities?.join(", ") || "",
      contact_phone: property.contact_phone || "",
      contact_email: property.contact_email || "",
      is_available: property.is_available,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      const { error } = await supabase.from("properties").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Property deleted successfully",
      });

      fetchProperties();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      property_type: "home",
      location: "",
      monthly_rent: "",
      bedrooms: "",
      bathrooms: "",
      square_feet: "",
      amenities: "",
      contact_phone: "",
      contact_email: "",
      is_available: true,
    });
    setEditingProperty(null);
    setSelectedImages([]);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">
            Please sign in to manage your properties.
          </p>
        </div>
      </div>
    );
  }

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              My Properties
            </h1>
            <p className="text-muted-foreground">Manage your rental listings</p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProperty ? "Edit Property" : "Add New Property"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="property_type">Property Type</Label>
                    <Select
                      value={formData.property_type}
                      onValueChange={(value: "home" | "shop") =>
                        setFormData({ ...formData, property_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="shop">Shop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="monthly_rent">Monthly Rent ($)</Label>
                    <Input
                      id="monthly_rent"
                      type="number"
                      value={formData.monthly_rent}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthly_rent: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      required
                    />
                  </div>
                  {formData.property_type === "home" && (
                    <>
                      <div>
                        <Label htmlFor="bedrooms">Bedrooms</Label>
                        <Input
                          id="bedrooms"
                          type="number"
                          value={formData.bedrooms}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bedrooms: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="bathrooms">Bathrooms</Label>
                        <Input
                          id="bathrooms"
                          type="number"
                          value={formData.bathrooms}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bathrooms: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label htmlFor="square_feet">Square Feet</Label>
                    <Input
                      id="square_feet"
                      type="number"
                      value={formData.square_feet}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          square_feet: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="amenities">
                      Amenities (comma-separated)
                    </Label>
                    <Input
                      id="amenities"
                      value={formData.amenities}
                      onChange={(e) =>
                        setFormData({ ...formData, amenities: e.target.value })
                      }
                      placeholder="WiFi, Parking, Air Conditioning"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="images">Images</Label>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {selectedImages.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {selectedImages.map((img, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-muted px-2 py-1 rounded"
                          >
                            {img.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProperty ? "Update" : "Create"} Property
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{property.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge
                      variant={property.is_available ? "default" : "secondary"}
                    >
                      {property.is_available ? "Available" : "Unavailable"}
                    </Badge>
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
                </div>
                <p className="text-muted-foreground">{property.location}</p>
              </CardHeader>
              <CardContent>
                {/* Show property images */}
                {property.images && property.images.length > 0 && (
                  <div className="mb-4 flex gap-2 overflow-x-auto">
                    {property.images.map((imgUrl, idx) => (
                      <img
                        key={idx}
                        src={imgUrl}
                        alt={`Property ${property.title} image ${idx + 1}`}
                        className="h-24 w-32 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
                <div className="text-2xl font-bold text-primary mb-4">
                  {formatPrice(property.monthly_rent)}/mo
                </div>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {property.description}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/property/${property.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(property)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(property.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No properties yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first property listing to get started.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Property
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageProperties;

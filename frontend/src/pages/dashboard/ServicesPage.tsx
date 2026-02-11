import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scissors,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Clock,
  Banknote,
  Star,
  TrendingUp,
  Filter,
  Grid3X3,
  List,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  category: string | null;
  image_url: string | null;
  image_public_id: string | null;
  is_active: boolean;
}

const CATEGORIES = ["Hair", "Spa", "Makeup", "Nails", "Skincare", "Other"];

export default function ServicesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { currentSalon, loading: salonLoading, isOwner, isManager, subscription, refreshSalons } = useSalon();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [customCategory, setCustomCategory] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "30",
    category: "",
    image_url: "",
    image_public_id: "",
    is_active: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchServices = async () => {
    if (!currentSalon) {
      if (!salonLoading) setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await api.services.getBySalon(currentSalon.id, true);
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        title: "Error",
        description: "Failed to load services from local database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [currentSalon]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      duration_minutes: "30",
      category: "",
      image_url: "",
      image_public_id: "",
      is_active: true,
    });
    setEditingService(null);
    setCustomCategory("");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const response = await api.uploads.upload(file);
      setFormData({ ...formData, image_url: response.url, image_public_id: response.public_id });
      toast({ title: "Success", description: "Service image uploaded" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrag = (e: React.DragEvent, type: 'image' | 'logo', isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'image') setIsDraggingImage(isEntering);
    else setIsDraggingLogo(isEntering);
  };

  const handleDrop = async (e: React.DragEvent, type: 'image' | 'logo') => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'image') setIsDraggingImage(false);
    else setIsDraggingLogo(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (type === 'image') {
        const fakeEvent = { target: { files: [file] } } as any;
        handleImageUpload(fakeEvent);
      } else {
        const fakeEvent = { target: { files: [file] } } as any;
        handleSalonLogoUpload(fakeEvent);
      }
    } else if (file) {
      toast({ title: "Invalid File", description: "Please drop an image file", variant: "destructive" });
    }
  };

  const handleSalonLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentSalon) return;

    setUploadingLogo(true);
    try {
      const response = await api.uploads.upload(file);
      await api.salons.update(currentSalon.id, {
        logo_url: response.url,
        logo_public_id: response.public_id
      });
      toast({ title: "Branding Updated", description: "Salon logo updated successfully" });
      // Optionally refresh the salon data here if useSalon doesn't auto-update
    } catch (error: any) {
      console.error("Logo Upload error:", error);
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    const isPredefined = service.category && CATEGORIES.includes(service.category) && service.category !== "Other";
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      category: service.category ? (isPredefined ? service.category : "Other") : "",
      image_url: service.image_url || "",
      image_public_id: service.image_public_id || "",
      is_active: service.is_active,
    });
    if (service.category && !isPredefined) {
      setCustomCategory(service.category);
    } else {
      setCustomCategory("");
    }
    setIsAddDialogOpen(true);
  };

  const handleSaveService = async () => {
    if (!currentSalon || !formData.name || !formData.price) return;

    setSaving(true);
    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes),
        category: formData.category === "Other" ? customCategory : (formData.category || null),
        image_url: formData.image_url || null,
        image_public_id: formData.image_public_id || null,
        is_active: formData.is_active,
        salon_id: currentSalon.id,
      };

      if (editingService) {
        await api.services.update(editingService.id, serviceData);
        toast({ title: "Success", description: "Service updated successfully" });
      } else {
        await api.services.create(serviceData);
        toast({ title: "Success", description: "Service created successfully" });
      }

      setIsAddDialogOpen(false);
      resetForm();
      fetchServices();
      await refreshSalons();
    } catch (error: any) {
      console.error("Error saving service:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save service locally",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      await api.services.delete(serviceId);
      toast({ title: "Success", description: "Service deleted from local database" });
      fetchServices();
      await refreshSalons();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error",
        description: "Failed to delete service locally",
        variant: "destructive",
      });
    }
  };

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      await api.services.update(serviceId, { is_active: isActive });
      fetchServices();
    } catch (error) {
      console.error("Error updating service status:", error);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const groupedServices = filteredServices.reduce((acc, service) => {
    const category = service.category || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "hair": return "💇‍♀️";
      case "spa": return "🧖‍♀️";
      case "makeup": return "💄";
      case "nails": return "💅";
      case "skincare": return "✨";
      default: return "💆‍♀️";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "hair": return "from-[#FF6B6B] to-[#FF8E8E] shadow-red-200";
      case "spa": return "from-[#4ECDC4] to-[#7CE7E0] shadow-teal-200";
      case "makeup": return "from-[#A78BFA] to-[#C4B5FD] shadow-purple-200";
      case "nails": return "from-[#F472B6] to-[#FB923C] shadow-pink-200";
      case "skincare": return "from-[#60A5FA] to-[#93C5FD] shadow-blue-200";
      default: return "from-gray-400 to-gray-500 shadow-gray-200";
    }
  };

  const totalServices = services.length;
  const activeServices = services.filter(s => s.is_active).length;
  const avgPrice = services.length > 0 ? services.reduce((sum, s) => sum + s.price, 0) / services.length : 0;

  if (authLoading || salonLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ResponsiveDashboardLayout
      showBackButton={true}
      headerActions={
        (isOwner || isManager) && (
          <div className="flex flex-col items-end gap-1">
            {subscription && (
              <span className="text-[10px] font-black uppercase text-slate-400">
                Limit: {subscription.current_service_count} / {subscription.max_services}
              </span>
            )}
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              disabled={subscription ? subscription.current_service_count >= subscription.max_services : false}
              className="bg-gradient-to-r from-accent to-accent/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {subscription && subscription.current_service_count >= subscription.max_services
                ? "Limit Reached"
                : <><Plus className="w-4 h-4 mr-1" /> Add Service</>}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
                Services & Pricing
              </h1>
              <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border-accent/20 transition-colors px-3 py-1 font-semibold">
                {totalServices} Services
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg font-medium">
              Manage your salon services, pricing, and categories with precision
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-border/50 hover:bg-secondary/50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Export Menu
            </Button>
            {(isOwner || isManager) && (
              <Dialog
                open={isAddDialogOpen}
                onOpenChange={(open) => {
                  setIsAddDialogOpen(open);
                  if (!open) resetForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-white shadow-lg shadow-accent/25">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-xl rounded-3xl p-0 overflow-hidden">
                  <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-transparent p-6 pb-4">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        {editingService ? (
                          <>
                            <Edit className="w-6 h-6 text-accent" />
                            Update Service
                          </>
                        ) : (
                          <>
                            <Plus className="w-6 h-6 text-accent" />
                            Create New Service
                          </>
                        )}
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground font-medium">
                        {editingService
                          ? "Modify the details of your existing service offering"
                          : "Define a new service for your salon's digital menu"}
                      </DialogDescription>
                    </DialogHeader>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto px-6 py-2 space-y-5 custom-scrollbar">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Service Name</Label>
                      <div className="relative">
                        <Scissors className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/50" />
                        <Input
                          id="name"
                          placeholder="e.g., Signature Wedding Haircut"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="pl-11 h-12 bg-secondary/30 border-none focus:ring-2 focus:ring-accent/20 rounded-xl font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Expert styling including wash, cut, and blow dry..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        rows={3}
                        className="bg-secondary/30 border-none focus:ring-2 focus:ring-accent/20 rounded-xl font-medium resize-none p-4"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Price (RM)</Label>
                        <div className="relative">
                          <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent/50" />
                          <Input
                            id="price"
                            type="number"
                            placeholder="500"
                            value={formData.price}
                            onChange={(e) =>
                              setFormData({ ...formData, price: e.target.value })
                            }
                            className="pl-11 h-12 bg-secondary/30 border-none focus:ring-2 focus:ring-accent/20 rounded-xl font-bold text-accent"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Duration</Label>
                        <Select
                          value={formData.duration_minutes}
                          onValueChange={(v) =>
                            setFormData({ ...formData, duration_minutes: v })
                          }
                        >
                          <SelectTrigger className="h-12 bg-secondary/30 border-none focus:ring-0 rounded-xl font-medium">
                            <Clock className="w-4 h-4 text-accent/50 mr-2" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="15" className="rounded-lg">15 mins</SelectItem>
                            <SelectItem value="30" className="rounded-lg">30 mins</SelectItem>
                            <SelectItem value="45" className="rounded-lg">45 mins</SelectItem>
                            <SelectItem value="60" className="rounded-lg">1 hour</SelectItem>
                            <SelectItem value="90" className="rounded-lg">1.5 hours</SelectItem>
                            <SelectItem value="120" className="rounded-lg">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Service Image</Label>

                      <div
                        className={cn(
                          "group relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-accent/40 bg-slate-50/50 transition-all",
                          isDraggingImage && "scale-[1.02] border-accent bg-accent/5 ring-4 ring-accent/10"
                        )}
                        onDragOver={(e) => handleDrag(e, 'image', true)}
                        onDragLeave={(e) => handleDrag(e, 'image', false)}
                        onDrop={(e) => handleDrop(e, 'image')}
                      >
                        {formData.image_url ? (
                          <>
                            <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Label htmlFor="image-upload" className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                <Upload className="w-4 h-4" /> Change Image
                              </Label>
                            </div>
                          </>
                        ) : (
                          <Label htmlFor="image-upload" className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-accent group-hover:scale-110 transition-all">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold text-slate-600">Select Treatment Photo</p>
                              <p className="text-[10px] text-slate-400 font-medium">PNG, JPG, WebP or AVIF (Max 5MB)</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">or drag and drop</p>
                            </div>
                          </Label>
                        )}

                        {isDraggingImage && (
                          <div className="absolute inset-0 bg-accent/10 backdrop-blur-[1px] flex items-center justify-center border-2 border-dashed border-accent rounded-2xl">
                            <Upload className="w-10 h-10 text-accent animate-bounce" />
                          </div>
                        )}

                        {uploadingImage && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-accent">Uploading to Vault...</p>
                          </div>
                        )}
                      </div>

                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </div>

                    <div className="h-px bg-slate-100 my-2" />

                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Salon Logo Branding</Label>
                      <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div
                          className={cn(
                            "relative w-20 h-20 flex-shrink-0 transition-all",
                            isDraggingLogo && "scale-110 ring-4 ring-accent/10"
                          )}
                          onDragOver={(e) => handleDrag(e, 'logo', true)}
                          onDragLeave={(e) => handleDrag(e, 'logo', false)}
                          onDrop={(e) => handleDrop(e, 'logo')}
                        >
                          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white shadow-md bg-white">
                            {currentSalon?.logo_url ? (
                              <img src={currentSalon.logo_url} className="w-full h-full object-cover" alt="Salon Logo" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <Label htmlFor="salon-logo-upload" className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                            <Upload className="w-3 h-3" />
                          </Label>
                          {uploadingLogo && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-full flex items-center justify-center">
                              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                          {isDraggingLogo && (
                            <div className="absolute inset-0 bg-accent/20 backdrop-blur-[1px] rounded-full flex items-center justify-center border-2 border-dashed border-accent">
                              <Upload className="w-5 h-5 text-accent animate-bounce" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-700">Establishment Logo</p>
                          <p className="text-[10px] text-slate-400 font-medium leading-tight">This logo appears on all your services in the public registry.</p>
                        </div>
                        <input
                          id="salon-logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleSalonLogoUpload}
                          disabled={uploadingLogo}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => {
                          setFormData({ ...formData, category: v });
                          if (v !== "Other") setCustomCategory("");
                        }}
                      >
                        <SelectTrigger className="h-12 bg-secondary/30 border-none focus:ring-0 rounded-xl font-medium">
                          <div className="flex items-center gap-2">
                            {formData.category ? (
                              <span className="text-lg">{getCategoryIcon(formData.category)}</span>
                            ) : (
                              <Filter className="w-4 h-4 text-accent/50" />
                            )}
                            <SelectValue placeholder="Select category" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="rounded-lg">
                              <div className="flex items-center gap-3 py-1">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getCategoryColor(cat)} flex items-center justify-center text-white text-base shadow-sm`}>
                                  {getCategoryIcon(cat)}
                                </div>
                                <span className="font-semibold">{cat}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {formData.category === "Other" && (
                        <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <Label htmlFor="custom-category" className="text-[10px] font-black uppercase tracking-widest text-accent ml-1">Specify Category</Label>
                          <Input
                            id="custom-category"
                            placeholder="e.g., Massage, Body Scrub..."
                            value={customCategory}
                            onChange={(e) => setCustomCategory(e.target.value)}
                            className="h-12 bg-accent/5 border-accent/20 focus:ring-2 focus:ring-accent/20 rounded-xl font-medium mt-1"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-accent/5 border border-accent/10 shadow-inner">
                      <div className="space-y-0.5">
                        <Label htmlFor="is_active" className="text-sm font-bold text-foreground">Service Visibility</Label>
                        <p className="text-xs text-muted-foreground font-medium">
                          {formData.is_active ? "Visible to customers for booking" : "Hidden from public service menu"}
                        </p>
                      </div>
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_active: checked })
                        }
                        className="data-[state=checked]:bg-accent"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-secondary/10 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setIsAddDialogOpen(false)}
                      className="flex-1 h-12 rounded-xl font-bold hover:bg-secondary/20 text-muted-foreground"
                    >
                      Discard
                    </Button>
                    <Button
                      onClick={handleSaveService}
                      disabled={!formData.name || !formData.price || saving}
                      className="flex-[2] h-12 bg-accent hover:bg-accent/90 text-white rounded-xl font-black shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
                    >
                      {saving ? "Saving Changes..." : editingService ? "Update Details" : "Publish Service"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-xl shadow-blue-500/10 bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-transparent backdrop-blur-sm overflow-hidden group hover:shadow-blue-500/20 transition-all duration-300">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-semibold text-blue-600/80 uppercase tracking-wider">Total Services</p>
                  <p className="text-4xl font-black text-blue-900 mt-2">{totalServices}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-xs font-medium text-blue-600">{activeServices} active now</p>
                  </div>
                </div>
                <div className="w-14 h-14 bg-white shadow-lg rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <Scissors className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl shadow-emerald-500/10 bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-transparent backdrop-blur-sm overflow-hidden group hover:shadow-emerald-500/20 transition-all duration-300">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-semibold text-emerald-600/80 uppercase tracking-wider">Avg. Price</p>
                  <p className="text-4xl font-black text-emerald-900 mt-2">RM {Math.round(avgPrice)}</p>
                  <p className="text-xs font-medium text-emerald-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Standard Rate
                  </p>
                </div>
                <div className="w-14 h-14 bg-white shadow-lg rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <Banknote className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl shadow-purple-500/10 bg-gradient-to-br from-purple-500/5 via-purple-500/10 to-transparent backdrop-blur-sm overflow-hidden group hover:shadow-purple-500/20 transition-all duration-300">
            <CardContent className="p-6 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-sm font-semibold text-purple-600/80 uppercase tracking-wider">Categories</p>
                  <p className="text-4xl font-black text-purple-900 mt-2">{Object.keys(groupedServices).length}</p>
                  <p className="text-xs font-medium text-purple-600 mt-1">Specialized care items</p>
                </div>
                <div className="w-14 h-14 bg-white shadow-lg rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <Star className="w-7 h-7 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="border-0 shadow-2xl shadow-black/5 bg-white/60 backdrop-blur-xl sticky top-2 z-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none" />
          <CardContent className="p-4 relative">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 w-full relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <Input
                  placeholder="Search services by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white/50 border-input/50 focus:bg-white focus:ring-accent/20 transition-all text-base rounded-xl shadow-inner shadow-black/5"
                />
              </div>
              <div className="flex w-full lg:w-auto items-center gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full lg:w-48 h-12 bg-white/50 border-input/50 rounded-xl shadow-inner shadow-black/5 font-medium">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-input/50 shadow-2xl">
                    <SelectItem value="all" className="rounded-lg">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none">{getCategoryIcon(cat)}</span>
                          <span>{cat}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1.5 bg-secondary/50 rounded-xl p-1.5 shadow-inner shadow-black/5">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid"
                      ? "bg-white text-accent shadow-lg shadow-black/5 hover:bg-white rounded-lg"
                      : "text-muted-foreground hover:bg-white/50 rounded-lg"}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list"
                      ? "bg-white text-accent shadow-lg shadow-black/5 hover:bg-white rounded-lg"
                      : "text-muted-foreground hover:bg-white/50 rounded-lg"}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 animate-pulse">
                    <div className="w-16 h-16 bg-secondary/50 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="w-48 h-5 bg-secondary/50 rounded" />
                      <div className="w-32 h-4 bg-secondary/50 rounded" />
                    </div>
                    <div className="w-24 h-8 bg-secondary/50 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <Card className="border-0 shadow-2xl shadow-black/5 bg-white/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
            <CardContent className="py-24 text-center relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10" />
              <div className="w-24 h-24 bg-gradient-to-br from-accent/20 to-accent/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/50 group hover:scale-110 transition-transform duration-500">
                <Scissors className="w-12 h-12 text-accent animate-bounce" />
              </div>
              <h3 className="text-3xl font-black text-foreground mb-3 tracking-tight">Your Service Menu is Quiet</h3>
              <p className="text-muted-foreground mb-10 max-w-sm mx-auto font-medium text-lg">
                {searchQuery || categoryFilter !== "all"
                  ? "We couldn't find any services matching your current filters. Try expanding your search."
                  : "Every great salon starts with a curated list of services. Let's build your menu today."
                }
              </p>
              {(isOwner || isManager) && (
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="h-14 px-8 bg-accent hover:bg-accent/90 text-white rounded-2xl font-black shadow-xl shadow-accent/25 transition-all hover:-translate-y-1 active:scale-95 text-lg"
                >
                  <Plus className="w-6 h-6 mr-3" />
                  {searchQuery || categoryFilter !== "all" ? "Add New Service" : "Create Your First Service"}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className={`
            ${viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12"
              : "space-y-4 pb-12"
            }
          `}>
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className={`group border-0 shadow-sm hover:shadow-2xl hover:shadow-accent/20 transition-all duration-500 bg-white dark:bg-zinc-900 rounded-[2rem] overflow-hidden flex flex-col h-full ${!service.is_active ? "opacity-60 grayscale-[0.5]" : ""
                  } ${viewMode === "list" ? "flex-row h-auto items-center p-4" : ""}`}
              >
                {/* Card Header/Image Area */}
                <div className={`relative overflow-hidden ${viewMode === "list" ? "w-24 h-24 rounded-2xl flex-shrink-0" : "h-44"}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(service.category || 'Other')} opacity-20 group-hover:opacity-30 transition-opacity`} />
                  {service.image_url ? (
                    <img src={service.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={service.name} />
                  ) : (
                    <div className={`absolute inset-0 flex items-center justify-center ${viewMode === "list" ? "text-3xl" : "text-7xl"} group-hover:scale-110 transition-transform duration-500`}>
                      {getCategoryIcon(service.category || 'Other')}
                    </div>
                  )}
                  {viewMode === "grid" && (
                    <>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-white/90 backdrop-blur-md text-foreground font-bold border-none shadow-sm px-3 py-1 rounded-full text-[10px] tracking-widest">
                          {service.duration_minutes} MINS
                        </Badge>
                      </div>
                      <div className="absolute top-4 left-4">
                        <Badge className={`bg-white/90 backdrop-blur-md text-foreground border-none shadow-sm px-3 py-1 rounded-full text-[10px] tracking-widest flex items-center gap-1`}>
                          <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${getCategoryColor(service.category || 'Other')}`}></span>
                          {service.category || 'Uncategorized'}
                        </Badge>
                      </div>
                    </>
                  )}
                  {!service.is_active && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <Badge variant="destructive" className="font-black tracking-tighter uppercase px-4 text-[10px]">Inactive</Badge>
                    </div>
                  )}
                </div>

                <CardContent className={`p-6 flex flex-col flex-1 ${viewMode === "list" ? "p-0 pl-6 flex-row items-center justify-between" : ""}`}>
                  <div className={`flex-1 space-y-4 ${viewMode === "list" ? "space-y-1 mb-0" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-xl font-bold text-foreground leading-tight capitalize group-hover:text-accent transition-colors">
                        {service.name.toLowerCase()}
                      </h3>
                      {(isOwner || isManager) && viewMode === "grid" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-accent/10 hover:text-accent"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-none">
                            <DropdownMenuItem onClick={() => openEditDialog(service)} className="rounded-xl py-3 font-semibold">
                              <Edit className="w-4 h-4 mr-3 text-blue-500" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-xl py-3 font-semibold"
                              onClick={() => toggleServiceStatus(service.id, !service.is_active)}
                            >
                              {service.is_active ? (
                                <><EyeOff className="w-4 h-4 mr-3 text-amber-500" /> Hide from Menu</>
                              ) : (
                                <><Eye className="w-4 h-4 mr-3 text-emerald-500" /> Publish to Menu</>
                              )}
                            </DropdownMenuItem>
                            {isOwner && (
                              <>
                                <DropdownMenuSeparator className="my-1 opacity-50" />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                      onSelect={(e) => e.preventDefault()}
                                      className="text-destructive hover:bg-destructive/10 rounded-xl py-3 font-bold"
                                    >
                                      <Trash2 className="w-4 h-4 mr-3" />
                                      Delete Service
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-2xl font-black tracking-tight text-slate-900">Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                        This will permanently remove <span className="font-bold text-slate-900">{service.name}</span> from your service menu. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-2">
                                      <AlertDialogCancel className="rounded-xl font-bold border-slate-200">Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteService(service.id)}
                                        className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-black"
                                      >
                                        Yes, Delete Service
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {service.description && (
                      <p className={`text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed font-medium ${viewMode === "list" ? "hidden md:block" : ""}`}>
                        {service.description}
                      </p>
                    )}
                  </div>

                  <div className={`mt-8 pt-5 border-t border-accent/5 flex items-end justify-between ${viewMode === "list" ? "mt-0 pt-0 border-0 items-center gap-6" : ""}`}>
                    <div className="space-y-1">
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none ${viewMode === "list" ? "hidden" : ""}`}>Price</p>
                      <p className="text-3xl font-black text-foreground flex items-center tracking-tighter">
                        <span className="text-lg font-medium mr-1 opacity-60">RM</span>
                        {service.price.toLocaleString()}
                      </p>
                    </div>

                    <Button
                      onClick={() => openEditDialog(service)}
                      className="bg-accent/10 hover:bg-accent text-accent hover:text-white font-black text-[10px] uppercase tracking-widest h-11 px-6 rounded-2xl transition-all shadow-sm"
                    >
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ResponsiveDashboardLayout >
  );
}

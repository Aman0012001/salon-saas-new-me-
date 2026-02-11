import { useState, useRef, useEffect } from "react";
import { Plus, Loader2, UserPlus, Info, UploadCloud, ImageIcon, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { countryCodes } from "@/utils/countryCodes";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface AddStaffDialogProps {
    salonId: string;
    staffCount: number;
    onSuccess: () => void;
    trigger?: React.ReactNode;
}

export function AddStaffDialog({ salonId, staffCount, onSuccess, trigger }: AddStaffDialogProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [allServices, setAllServices] = useState<any[]>([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        countryCode: "+60",
        role: "staff" as "staff",
        commission: "0",
        specializations: "",
        avatar_url: "",
        password: "",
        assigned_services: [] as string[]
    });
    const [showPassword, setShowPassword] = useState(false);

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            phone: "",
            countryCode: "+60",
            role: "staff",
            commission: "0",
            specializations: "",
            avatar_url: "",
            password: "",
            assigned_services: []
        });
        setShowPassword(false);
    };

    const fetchServices = async () => {
        if (!salonId) return;
        setLoadingServices(true);
        try {
            const data = await api.services.getBySalon(salonId);
            setAllServices(data);
        } catch (error) {
            console.error("Failed to fetch services", error);
        } finally {
            setLoadingServices(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchServices();
        }
    }, [isOpen, salonId]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        setUploading(true);
        try {
            const result = await api.uploads.upload(file);
            setFormData(prev => ({ ...prev, avatar_url: result.url }));
            toast({ title: "Upload Success", description: "Profile image has been updated." });
        } catch (error) {
            toast({ title: "Upload Failed", description: "Could not process image.", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            await uploadFile(file);
        }
    };

    const handleCreate = async () => {
        if (!salonId || !formData.name) return;

        setCreating(true);
        try {
            const fullPhone = formData.phone ? `${formData.countryCode}${formData.phone}` : null;
            const newStaff = await api.staff.create({
                salon_id: salonId,
                display_name: formData.name,
                email: formData.email || null,
                phone: fullPhone,
                specializations: formData.specializations.split(",").map(s => s.trim()).filter(Boolean),
                commission_percentage: parseInt(formData.commission) || 0,
                role: formData.role as 'staff',
                avatar_url: formData.avatar_url || null,
                password: formData.password || null,
                is_active: true,
            });

            if (formData.assigned_services.length > 0 && newStaff?.id) {
                await api.staff.syncServices(newStaff.id, formData.assigned_services);
            }

            toast({
                title: "Member Added",
                description: `${formData.name} has been successfully added to your team.`,
            });

            setIsOpen(false);
            resetForm();
            onSuccess();
        } catch (error: any) {
            toast({
                title: "Registration Failed",
                description: error.message || "Could not add team member.",
                variant: "destructive",
            });
        } finally {
            setCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="h-12 px-6 bg-[#F2A93B] hover:bg-[#E29A2B] text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Add Member
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white group/modal">
                <div className="bg-[#F2A93B] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <DialogHeader className="relative z-10 text-white">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-white">Add Team Member</DialogTitle>
                        <DialogDescription className="text-white/80 font-medium text-sm mt-1">
                            Enter the details of your new team member below.
                        </DialogDescription>
                    </DialogHeader>
                    <style gutter-attr="modal-close-override">{`
                        [data-radix-collection-item] button, 
                        .group\\/modal button[aria-label="Close"],
                        button[class*="DialogPrimitive.Close"] {
                            color: white !important;
                            opacity: 1 !important;
                        }
                    `}</style>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-5 max-h-[60vh] overflow-y-auto px-1 scrollbar-hide">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Full Name *</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="h-12 bg-slate-50 border-slate-100 rounded-xl font-semibold px-4 focus:ring-2 focus:ring-[#F2A93B]/10 transition-all"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="h-12 bg-slate-50 border-slate-100 rounded-xl font-semibold px-4 focus:ring-2 focus:ring-[#F2A93B]/10 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Access Pass (Password)</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Secure pass..."
                                        value={formData.password}
                                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        className="h-12 bg-slate-50 border-slate-100 rounded-xl font-semibold px-4 pr-12 focus:ring-2 focus:ring-[#F2A93B]/10 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Phone Number</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={formData.countryCode}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, countryCode: v }))}
                                    >
                                        <SelectTrigger className="w-[90px] h-12 bg-slate-50 border-slate-100 rounded-xl font-semibold px-3 focus:ring-2 focus:ring-[#F2A93B]/10 transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-2xl bg-white max-h-[300px]">
                                            {countryCodes.sort((a, b) => a.country.localeCompare(b.country)).map((c) => (
                                                <SelectItem key={`${c.country}-${c.code}`} value={c.code} className="font-semibold py-2.5 rounded-lg focus:bg-[#F2A93B]/10 cursor-pointer">
                                                    <span className="flex items-center gap-2">
                                                        <span>{c.flag}</span>
                                                        <span>{c.code}</span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="12345678"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, '') }))}
                                        className="h-12 bg-slate-50 border-slate-100 rounded-xl font-semibold px-4 flex-1 focus:ring-2 focus:ring-[#F2A93B]/10 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="specializations" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Specializations (comma separated)</Label>
                            <Input
                                id="specializations"
                                placeholder="Hair Styling, Color specialist, etc."
                                value={formData.specializations}
                                onChange={(e) => setFormData(prev => ({ ...prev, specializations: e.target.value }))}
                                className="h-12 bg-slate-50 border-slate-100 rounded-xl font-semibold px-4 focus:ring-2 focus:ring-[#F2A93B]/10 transition-all"
                            />
                        </div>

                        <div className="space-y-4 pt-4">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-[#F2A93B] ml-1">Assigned Services</Label>
                            {loadingServices ? (
                                <div className="flex items-center gap-2 p-4 justify-center bg-slate-50 rounded-xl">
                                    <Loader2 className="w-4 h-4 animate-spin text-[#F2A93B]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Matrix...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                                    {allServices.map((service) => (
                                        <div key={service.id} className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#F2A93B]/20 transition-all">
                                            <Checkbox
                                                id={`new-service-${service.id}`}
                                                checked={formData.assigned_services.includes(service.id)}
                                                onCheckedChange={(checked) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        assigned_services: checked
                                                            ? [...prev.assigned_services, service.id]
                                                            : prev.assigned_services.filter(id => id !== service.id)
                                                    }));
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <Label
                                                    htmlFor={`new-service-${service.id}`}
                                                    className="text-[11px] font-bold text-slate-700 uppercase cursor-pointer block truncate"
                                                >
                                                    {service.name}
                                                </Label>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{service.category || 'General'}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {allServices.length === 0 && (
                                        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">No services registered yet</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Profile Intelligence (Avatar)</Label>

                            <div className="flex gap-4">
                                <div
                                    onDragOver={onDragOver}
                                    onDragLeave={onDragLeave}
                                    onDrop={onDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group
                                        ${isDragging ? 'border-[#F2A93B] bg-[#F2A93B]/5 scale-105 ring-4 ring-[#F2A93B]/10' : formData.avatar_url ? 'border-[#F2A93B]/50' : 'border-slate-200 hover:border-[#F2A93B]/30 bg-slate-50'}`}
                                >
                                    {uploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="w-6 h-6 text-[#F2A93B] animate-spin" />
                                            <span className="text-[8px] font-bold text-[#F2A93B] uppercase">Syncing...</span>
                                        </div>
                                    ) : formData.avatar_url ? (
                                        <>
                                            <img src={formData.avatar_url} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <UploadCloud className="w-6 h-6 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2 group-hover:bg-[#F2A93B]/10 group-hover:scale-110 transition-all">
                                                {isDragging ? <UploadCloud className="w-5 h-5 text-[#F2A93B] animate-bounce" /> : <ImageIcon className="w-5 h-5 text-slate-400 group-hover:text-[#F2A93B]" />}
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{isDragging ? 'Release Now' : 'Import Asset'}</span>
                                        </>
                                    )}
                                    {isDragging && (
                                        <div className="absolute inset-0 bg-[#F2A93B]/10 backdrop-blur-[1px] flex items-center justify-center border-2 border-dashed border-[#F2A93B]">
                                            <UploadCloud className="w-8 h-8 text-[#F2A93B] animate-bounce" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="commission" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Commission Percentage (%)</Label>
                                    <Input
                                        id="commission"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.commission}
                                        onChange={(e) => setFormData(prev => ({ ...prev, commission: e.target.value }))}
                                        className="h-12 bg-slate-50 border-slate-100 rounded-xl font-semibold px-4 focus:ring-2 focus:ring-[#F2A93B]/10 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Access Level</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(v: "staff") => setFormData(prev => ({ ...prev, role: v }))}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl font-semibold px-4 focus:ring-2 focus:ring-[#F2A93B]/10 transition-all">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-2xl bg-white">
                                            <SelectItem value="staff" className="font-semibold py-2.5 rounded-xl">Staff Member</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-3 pt-4 border-t border-slate-50 sm:flex-row">
                            <Button variant="ghost" type="button" onClick={() => setIsOpen(false)} className="h-12 px-6 rounded-xl font-bold text-slate-400 hover:text-slate-900 transition-colors flex-1">
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleCreate}
                                disabled={!formData.name || creating}
                                className="h-12 px-8 bg-[#F2A93B] hover:bg-[#E29A2B] text-white font-bold rounded-xl shadow-lg flex-[2] transition-all"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {creating ? "Adding..." : "Add Team Member"}
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

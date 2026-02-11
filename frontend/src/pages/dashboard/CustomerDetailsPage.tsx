import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    Send,
    Smile,
    ChevronRight,
    Loader2,
    CheckCircle2,
    ShieldCheck,
    Fingerprint,
    Search,
    Filter,
    MoreVertical,
    Share2,
    LayoutDashboard,
    ArrowLeft,
    Phone,
    Mail,
    Clock,
    Plus,
    AlertCircle,
    Pill,
    ClipboardList,
    Calendar,
    MessageCircle,
    Activity,
    Save,
    FileText,
    User,
    TrendingUp,
    Settings,
    Star,
    Sparkles,
    Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Booking {
    id: string;
    booking_date: string;
    booking_time: string;
    status: string;
    service_name: string;
    price: number;
    duration_minutes: number;
    notes: string | null;
}

interface CustomerProfile {
    id?: string;
    user_id?: string;
    full_name: string | null;
    phone: string | null;
    email?: string;
    avatar_url: string | null;
    created_at?: string;
    date_of_birth?: string;
    skin_type?: string;
    skin_issues?: string;
    allergy_records?: string;
}

export default function CustomerDetailsPage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { currentSalon } = useSalon();
    const location = useLocation();
    const isStaffMode = location.pathname.startsWith("/staff");

    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("history");
    const [purchases, setPurchases] = useState<any[]>([]);
    const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
    const [newPurchase, setNewPurchase] = useState({ product_name: "", price: "" });
    const [savingPurchase, setSavingPurchase] = useState(false);

    const [dob, setDob] = useState("");
    const [skinType, setSkinType] = useState("");
    const [allergies, setAllergies] = useState("");
    const [skinIssues, setSkinIssues] = useState("");
    const [savingCRM, setSavingCRM] = useState(false);
    const [treatments, setTreatments] = useState<any[]>([]);

    // Treatment Record States
    const [isTreatmentDialogOpen, setIsTreatmentDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [treatmentData, setTreatmentData] = useState({
        treatment_details: "",
        products_used: "",
        skin_reaction: "",
        improvement_notes: "",
        recommended_next_treatment: "",
        post_treatment_instructions: "",
        follow_up_reminder_date: "",
        marketing_notes: "",
        before_photo_url: "",
        after_photo_url: "",
        service_name_manual: "",
        record_date: new Date().toISOString().split('T')[0]
    });
    const [savingTreatment, setSavingTreatment] = useState(false);

    // Booking Dialog States
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [selectedService, setSelectedService] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState("");

    const fetchData = async () => {
        if (!userId || !currentSalon) return;
        setLoading(true);
        try {
            // Fetch Profile from local API
            const profileData = await api.profiles.getById(userId);

            const bookingsData = await api.bookings.getAll({
                salon_id: currentSalon.id,
                user_id: userId
            });

            // If profile is thin but bookings have data, enrich it
            const enrichedProfile = { ...profileData };
            if (bookingsData && bookingsData.length > 0) {
                const latestBooking = bookingsData[0];
                if (!enrichedProfile.full_name) enrichedProfile.full_name = latestBooking.full_name;
                if (!enrichedProfile.phone) enrichedProfile.phone = latestBooking.phone;
                if (!enrichedProfile.email) enrichedProfile.email = latestBooking.email;
            }

            // Fetch CRM extended data
            try {
                const crmData = await api.customerRecords.getProfile(userId, currentSalon.id);
                if (crmData?.profile) {
                    setSkinType(crmData.profile.skin_type || "");
                    setAllergies(crmData.profile.allergy_records || "");
                    setSkinIssues(crmData.profile.skin_issues || "");
                    setDob(crmData.profile.date_of_birth || "");

                    // Also use CRM data as fallback for name if still missing
                }
            } catch (err) {
                console.warn("No CRM data found or error fetching it");
            }

            setProfile(enrichedProfile);
            setBookings(bookingsData || []);

            // Fetch Product Purchases
            try {
                const purchasesData = await api.productPurchases.getByCustomer(userId, currentSalon.id);
                setPurchases(purchasesData || []);
            } catch (err) {
                console.warn("Error fetching purchases:", err);
            }

            // Fetch Treatment History
            try {
                const treatmentsData = await api.customerRecords.getUserTreatments(userId, currentSalon.id);
                setTreatments(treatmentsData?.treatments || []);
            } catch (err) {
                console.warn("Error fetching treatments:", err);
            }

            // Handle query parameters for direct record opening
            const params = new URLSearchParams(window.location.search);
            const tab = params.get("tab");
            const bookingId = params.get("bookingId");

            if (tab) setActiveTab(tab);
            if (bookingId && bookingsData) {
                const targetBooking = bookingsData.find((b: any) => b.id === bookingId);
                if (targetBooking) {
                    handleOpenTreatmentRecord(targetBooking);
                }
            }

        } catch (error) {
            console.error("Error fetching local customer details:", error);
            toast({
                title: "Error",
                description: "Could not load data from local database",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId, currentSalon]);

    const handleSaveCRM = async () => {
        if (!userId || !currentSalon) return;
        setSavingCRM(true);
        try {
            await api.customerRecords.saveProfile({
                user_id: userId,
                salon_id: currentSalon.id,
                skin_type: skinType,
                allergy_records: allergies,
                skin_issues: skinIssues,
                date_of_birth: dob
            });
            toast({
                title: "Success",
                description: "Customer health profile updated successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update profile.",
                variant: "destructive"
            });
        } finally {
            setSavingCRM(false);
        }
    };



    const handleBooking = async () => {
        if (!selectedService || !selectedDate || !selectedTime || !currentSalon) {
            toast({
                title: "Incomplete Details",
                description: "Required fields missing.",
                variant: "destructive"
            });
            return;
        }

        try {
            // Manual booking creation in local DB
            await api.bookings.create({
                salon_id: currentSalon.id,
                user_id: userId,
                service_id: 'local-sync-' + Date.now(), // Placeholder for service logic
                status: "confirmed",
                booking_date: selectedDate,
                booking_time: selectedTime,
            });

            setIsBookingOpen(false);
            toast({
                title: "Booking Confirmed",
                description: `Appointment scheduled for ${selectedDate}.`,
            });

            // Refresh list
            const bData = await api.bookings.getAll({
                salon_id: currentSalon.id,
                user_id: userId
            });
            setBookings(bData || []);
        } catch (e) {
            toast({ title: "Booking Failed", variant: "destructive" });
        }
    };

    const handleOpenTreatmentRecord = async (booking: Booking) => {
        setSelectedBooking(booking);
        setIsTreatmentDialogOpen(true);
        try {
            const data = await api.customerRecords.getTreatmentRecord(booking.id);
            if (data?.record) {
                setTreatmentData({
                    treatment_details: data.record.treatment_details || "",
                    products_used: data.record.products_used || "",
                    skin_reaction: data.record.skin_reaction || "",
                    improvement_notes: data.record.improvement_notes || "",
                    recommended_next_treatment: data.record.recommended_next_treatment || "",
                    post_treatment_instructions: data.record.post_treatment_instructions || "",
                    follow_up_reminder_date: data.record.follow_up_reminder_date || "",
                    marketing_notes: data.record.marketing_notes || "",
                    before_photo_url: data.record.before_photo_url || "",
                    after_photo_url: data.record.after_photo_url || "",
                    service_name_manual: data.record.service_name_manual || "",
                    record_date: data.record.record_date || (booking.booking_date ? format(new Date(booking.booking_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
                });
            } else {
                setTreatmentData({
                    treatment_details: "",
                    products_used: "",
                    skin_reaction: "",
                    improvement_notes: "",
                    recommended_next_treatment: "",
                    post_treatment_instructions: "",
                    follow_up_reminder_date: "",
                    marketing_notes: "",
                    before_photo_url: "",
                    after_photo_url: "",
                    service_name_manual: "",
                    record_date: booking.booking_date ? format(new Date(booking.booking_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
                });
            }
        } catch (error) {
            console.error("Error fetching treatment record:", error);
        }
    };

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const response = await api.uploads.upload(file);
            if (response.url) {
                setTreatmentData(prev => ({
                    ...prev,
                    [type === 'before' ? 'before_photo_url' : 'after_photo_url']: response.url
                }));
                toast({ title: "Success", description: "Photo uploaded successfully" });
            }
        } catch (error) {
            console.error("Photo upload failed:", error);
            toast({ title: "Error", description: "Failed to upload photo", variant: "destructive" });
        }
    };

    const handleSaveTreatment = async () => {
        if (!selectedBooking) return;
        setSavingTreatment(true);
        try {
            // Save Profile Data (DOB & Skin Type)
            if (currentSalon && userId) {
                await api.customerRecords.saveProfile({
                    user_id: userId,
                    salon_id: currentSalon.id,
                    date_of_birth: dob,
                    skin_type: skinType,
                    allergy_records: allergies,
                    skin_issues: skinIssues
                });
            }

            await api.customerRecords.saveTreatmentRecord({
                booking_id: selectedBooking?.id || null,
                user_id: userId,
                salon_id: currentSalon.id,
                ...treatmentData
            });
            toast({
                title: "Success",
                description: "Treatment record updated successfully.",
            });
            setIsTreatmentDialogOpen(false);

            // Refresh treatments
            const treatmentsData = await api.customerRecords.getUserTreatments(userId, currentSalon.id);
            setTreatments(treatmentsData?.treatments || []);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save treatment record.",
                variant: "destructive"
            });
        } finally {
            setSavingTreatment(false);
        }
    };

    const handleAddPurchase = async () => {
        if (!userId || !currentSalon || !newPurchase.product_name || !newPurchase.price) {
            toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
            return;
        }

        setSavingPurchase(true);
        try {
            await api.productPurchases.create({
                user_id: userId,
                salon_id: currentSalon.id,
                product_name: newPurchase.product_name,
                price: parseFloat(newPurchase.price),
                purchase_date: new Date().toISOString().split('T')[0]
            });

            toast({ title: "Success", description: "Product purchase recorded." });
            setIsPurchaseDialogOpen(false);
            setNewPurchase({ product_name: "", price: "" });

            // Refresh purchases
            const purchasesData = await api.productPurchases.getByCustomer(userId, currentSalon.id);
            setPurchases(purchasesData || []);
        } catch (error) {
            toast({ title: "Error", description: "Failed to record purchase.", variant: "destructive" });
        } finally {
            setSavingPurchase(false);
        }
    };

    if (loading) {
        return (
            <ResponsiveDashboardLayout>
                <div className="flex items-center justify-center h-screen bg-[#F0F2F5]">
                    <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
                </div>
            </ResponsiveDashboardLayout>
        );
    }

    if (!profile) {
        return (
            <ResponsiveDashboardLayout>
                <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700">Dossier Missing</h2>
                    <Button onClick={() => navigate(isStaffMode ? "/staff/customers" : "/salon/customers")} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Return
                    </Button>
                </div>
            </ResponsiveDashboardLayout>
        );
    }

    // Derived Data for UI
    const totalSpend = bookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
    const uniqueServices = Array.from(new Set(bookings.map(b => b.service_name).filter(Boolean)));
    const lastVisit = bookings.length > 0 ? bookings[0].booking_date : "N/A";

    return (
        <ResponsiveDashboardLayout>
            <div className="min-h-screen bg-[] p-4 md:p-8 font-sans text-slate-800 -m-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Main Header */}
                    <div className="bg-[#1e3a8a] text-white py-4 px-6 rounded-t-lg shadow-sm border-b-4 border-[#fbbf24] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(isStaffMode ? "/staff/customers" : "/salon/customers")}
                                className="text-white hover:bg-white/10"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <h1 className="text-2xl font-bold tracking-wider uppercase">Customer Profile</h1>
                        </div>
                        <div className="hidden md:block h-px flex-1 bg-white/20 mx-8"></div>
                    </div>

                    {/* Top Row: Profile & History */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        {/* Profile Card (Left - Wider) */}
                        <div className="lg:col-span-7">
                            <Card className="h-full border border-slate-300 shadow-sm bg-[#F9FAFB] rounded-lg overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="shrink-0 text-center md:text-left">
                                            <Avatar className="w-32 h-32 rounded-lg border-4 border-white shadow-md mx-auto md:mx-0">
                                                <AvatarImage src={profile.avatar_url || ""} className="object-cover" />
                                                <AvatarFallback className="rounded-lg text-4xl bg-slate-200 text-slate-400">
                                                    {profile.full_name?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                                    <h2 className="text-2xl font-bold text-slate-900">{profile.full_name || "Unknown Guest"}</h2>
                                                    {bookings.length > 5 && (
                                                        <span className="flex items-center gap-1 text-[#d97706] font-bold text-sm bg-[#fef3c7] px-2 py-0.5 rounded-full border border-[#fcd34d]">
                                                            <Star className="w-3 h-3 fill-current" /> VIP Client
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2 pt-2 border-t border-slate-200 text-sm">
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-4 h-4 text-[#1e3a8a]" />
                                                    <span className="font-semibold">{profile.phone || "No Contact"}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-4 h-4 text-[#1e3a8a]" />
                                                    <span className="font-semibold">{profile.email || "No Email"}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-4 h-4 text-[#1e3a8a]" />
                                                    <span className="font-semibold">DOB: {dob ? format(new Date(dob), 'MM/dd/yyyy') : 'Not Set'} {dob && `(Age: ${new Date().getFullYear() - new Date(dob).getFullYear()})`}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheck className="w-4 h-4 text-[#1e3a8a]" />
                                                    <span className="font-semibold text-slate-600 italic">Skin Type: {skinType || "Unspecified"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Last Visit</p>
                                            <p className="text-lg font-bold text-slate-900 mt-1">{lastVisit !== "N/A" ? format(new Date(lastVisit), 'MM/dd/yyyy') : "N/A"}</p>
                                        </div>
                                        <div className="border-l border-slate-300">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Visits</p>
                                            <p className="text-lg font-bold text-slate-900 mt-1">{bookings.length}</p>
                                        </div>
                                        <div className="border-l border-slate-300">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Spend</p>
                                            <p className="text-lg font-bold text-[#059669] mt-1">${totalSpend.toFixed(2)}</p>
                                        </div>
                                    </div>


                                </CardContent>
                            </Card>
                        </div>

                        {/* History & Clinical Tabs (Right) */}
                        <div className="lg:col-span-5">
                            <Card className="h-full border border-slate-300 shadow-sm bg-[#F9FAFB] rounded-lg">
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="w-full bg-[#F3F4F6] border-b border-slate-200 rounded-t-lg rounded-b-none justify-start px-4 h-11">
                                        <TabsTrigger value="history" className="text-xs font-bold uppercase tracking-wider h-8 data-[state=active]:bg-white">History</TabsTrigger>
                                        <TabsTrigger value="clinical" className="text-xs font-bold uppercase tracking-wider h-8 data-[state=active]:bg-white">Clinical</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="history" className="p-0 m-0">
                                        <div className="max-h-[500px] overflow-y-auto">
                                            {bookings.length === 0 ? (
                                                <div className="p-6 text-center text-slate-400 text-sm italic">No history available.</div>
                                            ) : (
                                                <table className="w-full text-sm text-left">
                                                    <tbody className="divide-y divide-slate-200">
                                                        {bookings.map((b) => (
                                                            <tr key={b.id} className="hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => handleOpenTreatmentRecord(b)}>
                                                                <td className="py-3 px-4 font-medium text-slate-600">{format(new Date(b.booking_date), 'MM/dd/yyyy')}</td>
                                                                <td className="py-3 px-4 text-slate-900 font-semibold truncate max-w-[120px]">{b.service_name || "Service"}</td>
                                                                <td className="py-3 px-4 text-right font-bold text-slate-700">${b.price}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="clinical" className="p-4 m-0 space-y-6">
                                        {/* Simplified Health Summary info in tab */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {dob && <Badge variant="outline" className="bg-white">Age: {new Date().getFullYear() - new Date(dob).getFullYear()}</Badge>}
                                            {skinType && <Badge variant="outline" className="bg-white">Skin: {skinType}</Badge>}
                                            {allergies && <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-100">Allergy: {allergies.split(',')[0]}</Badge>}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Treatment Timeline</h3>
                                                <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold uppercase" onClick={() => {
                                                    setSelectedBooking(null);
                                                    setTreatmentData({
                                                        treatment_details: "",
                                                        products_used: "",
                                                        skin_reaction: "",
                                                        improvement_notes: "",
                                                        recommended_next_treatment: "",
                                                        post_treatment_instructions: "",
                                                        follow_up_reminder_date: "",
                                                        marketing_notes: "",
                                                        before_photo_url: "",
                                                        after_photo_url: "",
                                                        service_name_manual: "",
                                                        record_date: format(new Date(), 'yyyy-MM-dd')
                                                    });
                                                    setIsTreatmentDialogOpen(true);
                                                }}>
                                                    <Plus className="w-3 h-3 mr-1" /> New Entry
                                                </Button>
                                            </div>

                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                                {treatments.length === 0 ? (
                                                    <div className="text-center py-8 text-slate-400 italic text-xs">No clinical records found.</div>
                                                ) : (
                                                    treatments.map((tr, idx) => (
                                                        <div key={tr.id} className="relative pl-6 border-l-2 border-slate-200 py-1">
                                                            <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-slate-200 border-2 border-white" />
                                                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenTreatmentRecord({ id: tr.booking_id, service_name: tr.service_name || tr.service_name_manual, booking_date: tr.booking_date || tr.record_date || tr.created_at } as any)}>
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(tr.booking_date || tr.record_date || tr.created_at), 'MMM dd, yyyy')}</span>
                                                                    {tr.before_photo_url && tr.after_photo_url && <Sparkles className="w-3 h-3 text-emerald-500" />}
                                                                </div>
                                                                <h4 className="font-bold text-slate-900 text-sm">{tr.service_name || tr.service_name_manual || "General Record"}</h4>
                                                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{tr.treatment_details || "No details provided."}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </Card>
                        </div>
                    </div>

                    {/* Bottom Row Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* Services Card */}
                        <div className="lg:col-span-1">
                            <Card className="h-full border border-slate-300 shadow-sm bg-[#F9FAFB] rounded-lg flex flex-col">
                                <CardHeader className="py-3 px-4 border-b border-slate-200 bg-[#F3F4F6] rounded-t-lg">
                                    <CardTitle className="text-sm font-bold text-[#1e3a8a] uppercase tracking-wider">Services & Products</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 flex-1">
                                    <ul className="space-y-2">
                                        {uniqueServices.length > 0 ? uniqueServices.map((s, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                                                <span className="mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0" />
                                                {s}
                                            </li>
                                        )) : (
                                            <li className="text-sm text-slate-400 italic">No services recorded.</li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Notes & Products Card */}
                        <div className="lg:col-span-1">
                            <Card className="h-full border border-slate-300 shadow-sm bg-[#F9FAFB] rounded-lg">
                                <CardHeader className="py-3 px-4 border-b border-slate-200 bg-[#F3F4F6] rounded-t-lg">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm font-bold text-[#1e3a8a] uppercase tracking-wider">Clinical Notes</CardTitle>
                                        <Button variant="ghost" size="sm" className="h-6 w-6" onClick={() => setActiveTab('plan')}><Settings className="w-3 h-3" /></Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <ul className="space-y-2">
                                        {(allergies || skinIssues) ? (
                                            <>
                                                {allergies.split(',').map((a, i) => a.trim() && (
                                                    <li key={`a-${i}`} className="flex items-start gap-2 text-sm text-rose-700 font-medium">
                                                        <span className="mt-1.5 w-1.5 h-1.5 bg-rose-400 rounded-full shrink-0" />
                                                        Allergy: {a.trim()}
                                                    </li>
                                                ))}
                                                {skinIssues.split(',').map((s, i) => s.trim() && (
                                                    <li key={`s-${i}`} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                                                        <span className="mt-1.5 w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0" />
                                                        {s.trim()}
                                                    </li>
                                                ))}
                                            </>
                                        ) : (
                                            <li className="text-sm text-slate-400 italic">No clinical notes recorded.</li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-1">
                            <Card className="h-full border border-slate-300 shadow-sm bg-[#F9FAFB] rounded-lg">
                                <CardHeader className="py-3 px-4 border-b border-slate-200 bg-[#F3F4F6] rounded-t-lg">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-sm font-bold text-[#1e3a8a] uppercase tracking-wider">Product Purchases</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs text-slate-500"
                                            onClick={() => setIsPurchaseDialogOpen(true)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-2 text-sm">
                                        {purchases.length > 0 ? (
                                            <>
                                                {purchases.map((p, i) => (
                                                    <div key={p.id || i} className="flex justify-between items-center text-slate-600">
                                                        <span>{p.product_name}</span>
                                                        <span className="font-bold">${parseFloat(p.price).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900 text-base">
                                                    <span>Total Product Spend</span>
                                                    <span>${purchases.reduce((sum, p) => sum + parseFloat(p.price || 0), 0).toFixed(2)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center text-slate-400 italic py-4">No purchases recorded.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>


                    </div>

                </div>
            </div>

            {/* KEEPING EXISTING DIALOGS HIDDEN BUT FUNCTIONAL */}
            <AnimatePresence>
                {isBookingOpen && (
                    <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>New Appointment</DialogTitle>
                                <DialogDescription>Schedule a session for {profile.full_name}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Select onValueChange={setSelectedService}>
                                    <SelectTrigger><SelectValue placeholder="Select Service" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Hydrafacial">Hydrafacial</SelectItem>
                                        <SelectItem value="Hair Cut">Hair Cut</SelectItem>
                                        <SelectItem value="Consultation">Consultation</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                                <Input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleBooking}>Confirm Booking</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </AnimatePresence>

            <Dialog open={isTreatmentDialogOpen} onOpenChange={setIsTreatmentDialogOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-lg p-0 overflow-hidden max-h-[90vh] flex flex-col">
                    <DialogHeader className="p-6 pb-2 shrink-0">
                        <DialogTitle className="text-xl font-bold text-[#1e3a8a]">
                            {selectedBooking ? "Treatment Record" : "New Clinical Entry"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedBooking
                                ? `Details for ${selectedBooking.service_name} on ${format(new Date(selectedBooking.booking_date), 'MM/dd/yyyy')}`
                                : "Add notes or a procedure that wasn't tied to a specific appointment."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 pt-2">
                        {/* Patient Context & Procedure Info */}
                        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            {!selectedBooking && (
                                <>
                                    <div className="col-span-2">
                                        <Label className="uppercase text-xs font-bold text-slate-500 mb-1 block">Procedure / Service Name</Label>
                                        <Input
                                            value={treatmentData.service_name_manual}
                                            onChange={(e) => setTreatmentData({ ...treatmentData, service_name_manual: e.target.value })}
                                            placeholder="e.g. Skin Analysis, Consultation"
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="uppercase text-xs font-bold text-slate-500 mb-1 block">Date of Record</Label>
                                        <Input
                                            type="date"
                                            value={treatmentData.record_date}
                                            onChange={(e) => setTreatmentData({ ...treatmentData, record_date: e.target.value })}
                                            className="bg-white"
                                        />
                                    </div>
                                </>
                            )}
                            <div>
                                <Label className="uppercase text-xs font-bold text-slate-500 mb-1 block">Patient DOB</Label>
                                <Input
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div>
                                <Label className="uppercase text-xs font-bold text-slate-500 mb-1 block">Skin Type</Label>
                                <Input
                                    value={skinType}
                                    onChange={(e) => setSkinType(e.target.value)}
                                    placeholder="e.g. Oily, Dry"
                                    className="bg-white"
                                />
                            </div>
                            <div className="col-span-2">
                                <Label className="uppercase text-xs font-bold text-slate-500 mb-1 block">Critical Health Notes (Allergies & Issues)</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        value={allergies}
                                        onChange={(e) => setAllergies(e.target.value)}
                                        placeholder="Allergies"
                                        className="bg-white"
                                    />
                                    <Input
                                        value={skinIssues}
                                        onChange={(e) => setSkinIssues(e.target.value)}
                                        placeholder="Skin Issues"
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {Object.keys(treatmentData).filter(k => k !== 'service_name_manual' && k !== 'record_date').map(key => (
                                <div key={key} className={key.includes('notes') || key.includes('instructions') || key.includes('details') ? 'col-span-2' : ''}>
                                    <Label className="uppercase text-xs font-bold text-slate-500 mb-1 block">{key.replace(/_/g, ' ')}</Label>
                                    <Textarea
                                        value={(treatmentData as any)[key]}
                                        onChange={e => setTreatmentData({ ...treatmentData, [key]: e.target.value })}
                                        className="bg-slate-50 min-h-[80px]"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Photo Comparison Section */}
                        <div className="border-t border-slate-200 pt-4 mt-2">
                            <h3 className="text-sm font-bold text-[#1e3a8a] uppercase tracking-wider mb-4">Treatment Photos</h3>
                            <div className="grid grid-cols-2 gap-6">
                                {/* Before Photo */}
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                        <ImageIcon className="w-4 h-4" /> Before Treatment
                                    </Label>
                                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center  bg-slate-50 relative group hover:border-[#F2A93B] transition-colors">
                                        {treatmentData.before_photo_url ? (
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={treatmentData.before_photo_url}
                                                    alt="Before"
                                                    className="w-full h-48 object-cover rounded-md"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                    <Button variant="secondary" size="sm" className="pointer-events-none">Change Photo</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-400">
                                                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <span className="text-sm">Upload Photo</span>
                                            </div>
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => handlePhotoUpload(e, 'before')}
                                        />
                                    </div>
                                </div>

                                {/* After Photo */}
                                <div className="space-y-3">
                                    <Label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                                        <ImageIcon className="w-4 h-4" /> After Treatment
                                    </Label>
                                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center  bg-slate-50 relative group hover:border-[#F2A93B] transition-colors">
                                        {treatmentData.after_photo_url ? (
                                            <div className="relative w-full h-full">
                                                <img
                                                    src={treatmentData.after_photo_url}
                                                    alt="After"
                                                    className="w-full h-48 object-cover rounded-md"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                    <Button variant="secondary" size="sm" className="pointer-events-none">Change Photo</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center text-slate-400">
                                                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <span className="text-sm">Upload Photo</span>
                                            </div>
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => handlePhotoUpload(e, 'after')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-2 shrink-0">
                        <Button onClick={handleSaveTreatment} disabled={savingTreatment} className="bg-[#1e3a8a] hover:bg-blue-900 text-white">
                            {savingTreatment ? "Saving..." : "Save Record"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Purchase Dialog */}
            <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Record Product Purchase</DialogTitle>
                        <DialogDescription>Add a product sale for {profile.full_name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="product-name">Product Name</Label>
                            <Input
                                id="product-name"
                                placeholder="e.g. Daily Cleanser"
                                value={newPurchase.product_name}
                                onChange={e => setNewPurchase({ ...newPurchase, product_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="product-price">Price ($)</Label>
                            <Input
                                id="product-price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={newPurchase.price}
                                onChange={e => setNewPurchase({ ...newPurchase, price: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsPurchaseDialogOpen(false)}
                            disabled={savingPurchase}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddPurchase}
                            disabled={savingPurchase}
                            className="bg-[#1e3a8a] hover:bg-blue-900"
                        >
                            {savingPurchase ? "Saving..." : "Record Sale"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </ResponsiveDashboardLayout>
    );
}


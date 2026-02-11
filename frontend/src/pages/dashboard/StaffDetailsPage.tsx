import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Loader2,
    Briefcase,
    Calendar,
    Clock,
    DollarSign,
    Users,
    ChevronRight,
    ArrowRightLeft,
    PieChart,
    Plus,
    User,
    Mail,
    Phone,
    MapPin,
    ArrowLeft,
    Eye,
    EyeOff,
    Trash2
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useSalon } from "@/hooks/useSalon";
import { StaffMember } from "@/types/staff";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

export default function StaffDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isOwner } = useSalon();

    const [staff, setStaff] = useState<StaffMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
    const [leaves, setLeaves] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        display_name: "",
        email: "",
        phone: "",
        commission_percentage: 0,
        role: "staff" as any,
        is_active: true,
        password: "",
        assigned_services: [] as string[]
    });
    const [allServices, setAllServices] = useState<any[]>([]);
    const [showPassword, setShowPassword] = useState(false);

    const fetchProfileData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const staffMember = await api.staff.getById(id);

            if (!staffMember) {
                toast({
                    title: "Error",
                    description: "Staff member not found.",
                    variant: "destructive",
                });
                navigate("/salon/staff");
                return;
            }
            setStaff(staffMember);

            const month = selectedDate.getMonth() + 1;
            const year = selectedDate.getFullYear();

            const statsRes = await api.staff.getProfileStats(id, month, year);
            const leavesRes = await api.staff.getLeaves(id);

            setStats(statsRes.stats);
            setRecentCustomers(statsRes.recent_customers || []);
            setLeaves(leavesRes);

            // Fetch all salon services
            const salonServices = await api.services.getBySalon(staffMember.salon_id);
            setAllServices(salonServices);
        } catch (error: any) {
            console.error("Staff Profile Sync Error:", error);
            toast({
                title: "Data Sync Failed",
                description: error.message || "Could not retrieve comprehensive profile records.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [id, selectedDate, toast, navigate]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const getLeaveBadgeColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'rejected': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    const handleEditClick = () => {
        if (!staff) return;
        setEditForm({
            display_name: staff.display_name,
            email: staff.email || "",
            phone: staff.phone || "",
            commission_percentage: staff.commission_percentage || 0,
            role: staff.role || "staff",
            is_active: staff.is_active,
            password: "",
            assigned_services: staff.assigned_services || []
        });
        setIsEditDialogOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setIsUpdating(true);
        try {
            await api.staff.update(id, editForm);

            // Sync services separately
            await api.staff.syncServices(id, editForm.assigned_services);

            toast({
                title: "Profile Synchronized",
                description: "The staff record and service assignments have been updated."
            });
            setIsEditDialogOpen(false);
            fetchProfileData();
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.message || "Failed to sync staff records.",
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        try {
            await api.staff.delete(id);
            toast({
                title: "Profile Terminated",
                description: "The staff record has been permanently removed from the registry."
            });
            navigate("/salon/staff");
        } catch (error: any) {
            toast({
                title: "Deletion Failed",
                description: error.message || "Could not delete staff record.",
                variant: "destructive"
            });
        }
    };

    if (loading && !staff) {
        return (
            <ResponsiveDashboardLayout showBackButton={true}>
                <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#F2A93B]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Staff Profile Dossier...</p>
                </div>
            </ResponsiveDashboardLayout>
        );
    }

    if (!staff) return null;

    return (
        <ResponsiveDashboardLayout
            showBackButton={true}
        >
            <div className="min-h-screen bg-[#F8F9FA] pb-20">
                {/* Header Profile Section */}
                <div className="bg-white border-b border-slate-200">
                    <div className="max-w-[1400px] mx-auto px-6 py-12">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="relative"
                            >
                                <Avatar className="w-32 h-32 border-4 border-white shadow-2xl ring-1 ring-slate-100">
                                    <AvatarImage src={staff.avatar_url || ""} />
                                    <AvatarFallback className="bg-gradient-to-br from-[#F2A93B] to-[#E29A2B] text-white text-4xl font-black">
                                        {staff.display_name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                {staff.is_active && (
                                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg animate-pulse" />
                                )}
                            </motion.div>

                            <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center gap-4">
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">{staff.display_name}</h1>
                                    <Badge variant="outline" className="rounded-full bg-slate-50 border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest px-4 py-1">
                                        {staff.role?.replace('_', ' ')}
                                    </Badge>
                                    <Badge className={cn(
                                        "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none",
                                        staff.is_active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-300 text-white"
                                    )}>
                                        {staff.is_active ? "Active Duty" : "Offline"}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Mail className="w-4 h-4 text-[#F2A93B]" />
                                        <span className="text-sm font-bold">{staff.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Phone className="w-4 h-4 text-[#F2A93B]" />
                                        <span className="text-sm font-bold">{staff.phone || "(Not Provided)"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Briefcase className="w-4 h-4 text-[#F2A93B]" />
                                        <span className="text-sm font-bold">{staff.commission_percentage}% Commission Rate</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Clock className="w-4 h-4 text-[#F2A93B]" />
                                        <span className="text-sm font-bold">Joined {format(new Date(staff.created_at || new Date()), "MMM yyyy")}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex lg:flex-col gap-3">
                                <Button className="h-12 px-8 bg-[#F2A93B] hover:bg-[#E29A2B] text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#F2A93B]/20 transition-all active:scale-95">
                                    Message Staff
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleEditClick}
                                    className="h-12 px-8 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Edit Profile
                                </Button>

                                {isOwner && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="h-12 px-8 border-rose-200 text-rose-600 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-rose-50 hover:text-rose-700 transition-all active:scale-95"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete Profile
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-2xl font-black tracking-tight text-slate-900">Final Confirmation Required</AlertDialogTitle>
                                                <AlertDialogDescription className="text-slate-500 font-medium">
                                                    You are about to permanently delete <span className="font-bold text-slate-900">{staff.display_name}</span> from the salon. This action will purge all associated profile records and cannot be reversed.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="gap-2">
                                                <AlertDialogCancel className="rounded-xl font-bold border-slate-200 text-slate-500">Cancel & Retain</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleDelete}
                                                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black border-none"
                                                >
                                                    Confirm Deletion
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-[1400px] mx-auto px-6 mt-8">
                    <Tabs defaultValue="overview" className="space-y-8">
                        <div className="flex items-center justify-between border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm">
                            <TabsList className="bg-transparent h-12 gap-2">
                                {[
                                    { value: 'overview', label: 'Dashboard', icon: PieChart },
                                    { value: 'earnings', label: 'Financials', icon: DollarSign },
                                    { value: 'attendance', label: 'Time Logs', icon: Clock },
                                    { value: 'leaves', label: 'Absences', icon: Calendar },
                                    { value: 'customers', label: 'Clients', icon: Users },
                                ].map(tab => (
                                    <TabsTrigger
                                        key={tab.value}
                                        value={tab.value}
                                        className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
                                    >
                                        <tab.icon className="w-3.5 h-3.5 mr-2" />
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <div className="px-4 flex items-center gap-3">
                                <div className="flex bg-slate-50 p-1 rounded-xl items-center border border-slate-100">
                                    <button
                                        onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}
                                        className="p-1 px-3 hover:bg-white rounded-lg transition-all text-[#F2A93B]"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    <span className="px-4 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 min-w-[120px] text-center">
                                        {format(selectedDate, "MMMM yyyy")}
                                    </span>
                                    <button
                                        onClick={() => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}
                                        className="p-1 px-3 hover:bg-white rounded-lg transition-all text-[#F2A93B]"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="min-h-[500px]">
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex flex-col items-center justify-center py-20 space-y-4"
                                    >
                                        <Loader2 className="w-8 h-8 animate-spin text-[#F2A93B]" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Updating Visuals...</p>
                                    </motion.div>
                                ) : (
                                    <>
                                        <TabsContent value="overview" className="m-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {/* Quick Stats Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                {[
                                                    { label: 'Clients Handled', value: stats?.customers || 0, icon: Users, color: 'bg-blue-500', trend: '+12%' },
                                                    { label: 'Force Output (Hrs)', value: `${stats?.total_hours || 0}h`, icon: Clock, color: 'bg-[#F2A93B]', trend: '+5h' },
                                                    { label: 'Settled Earnings', value: `RM ${stats?.earnings?.toLocaleString() || 0}`, icon: DollarSign, color: 'bg-emerald-500', trend: '+18%' },
                                                    { label: 'Remaining Leaves', value: stats?.leave_days || 0, icon: Calendar, color: 'bg-rose-500', trend: 'Healthy' },
                                                ].map((stat, i) => (
                                                    <Card key={i} className="rounded-3xl border-none shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-300">
                                                        <CardContent className="p-8">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", stat.color)}>
                                                                    <stat.icon className="w-6 h-6" />
                                                                </div>
                                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{stat.trend}</span>
                                                            </div>
                                                            <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                {/* Revenue Distribution Chart (Mock) */}
                                                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white lg:col-span-2">
                                                    <CardHeader className="p-10 pb-4">
                                                        <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Revenue Performance</CardTitle>
                                                        <CardDescription className="text-xs font-bold text-slate-400">Daily business impact throughout the current deployment.</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="p-10 pt-4">
                                                        <div className="h-64 flex items-end gap-3 pt-8 pb-4 border-b border-slate-50">
                                                            {[45, 60, 40, 75, 55, 90, 65, 80, 50, 70, 85, 45, 60, 55, 90].map((h, i) => (
                                                                <div key={i} className="flex-1 group relative">
                                                                    <motion.div
                                                                        initial={{ height: 0 }}
                                                                        animate={{ height: `${h}%` }}
                                                                        transition={{ delay: i * 0.05, duration: 0.5 }}
                                                                        className={cn(
                                                                            "w-full bg-slate-100 rounded-t-xl group-hover:bg-[#F2A93B] transition-all cursor-pointer relative",
                                                                            h > 80 && "bg-[#F2A93B]/20"
                                                                        )}
                                                                    />
                                                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        RM {(h * 15).toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex justify-between mt-4">
                                                            <span className="text-[9px] font-black text-slate-300 uppercase">Week 01</span>
                                                            <span className="text-[9px] font-black text-slate-300 uppercase">Week 02</span>
                                                            <span className="text-[9px] font-black text-slate-300 uppercase">Week 03</span>
                                                            <span className="text-[9px] font-black text-slate-300 uppercase">Week 04</span>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* Skill Specializations */}
                                                <Card className="rounded-[2.5rem] border-none shadow-sm bg-white">
                                                    <CardHeader className="p-10 pb-4">
                                                        <CardTitle className="text-sm font-black uppercase tracking-widest text-[#F2A93B]">Specializations</CardTitle>
                                                        <CardDescription className="text-xs font-bold text-slate-400">Primary operational skillsets.</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="p-10 pt-4 space-y-6">
                                                        {['Hair Sculpting', 'Color Dynamics', 'Scalp Therapy', 'Bridal Styling'].map((skill, i) => (
                                                            <div key={skill} className="space-y-2">
                                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                                    <span className="text-slate-700">{skill}</span>
                                                                    <span className="text-[#F2A93B]">{95 - i * 8}%</span>
                                                                </div>
                                                                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${95 - i * 8}%` }}
                                                                        className="h-full bg-slate-900 rounded-full"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 mt-4">
                                                            View Full Skills Registry
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="earnings" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                                <div className="lg:col-span-1 space-y-6">
                                                    <Card className="rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative border-none shadow-2xl">
                                                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F2A93B]/20 blur-[100px] rounded-full" />
                                                        <CardContent className="p-10 relative z-10 space-y-6">
                                                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                                                                <DollarSign className="w-7 h-7 text-[#F2A93B]" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F2A93B] mb-2">Net Allocation</p>
                                                                <h4 className="text-4xl font-black">RM {stats?.earnings?.toLocaleString() || 0}</h4>
                                                            </div>
                                                            <div className="pt-6 border-t border-white/10 space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Base Rate</span>
                                                                    <span className="text-xs font-black">RM 2,400.00</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Commission {staff.commission_percentage}%</span>
                                                                    <span className="text-xs font-black text-emerald-400">+RM {stats?.earnings?.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Tax Provision</span>
                                                                    <span className="text-xs font-black text-rose-400">-RM 240.00</span>
                                                                </div>
                                                            </div>
                                                            <Button className="w-full h-14 bg-white text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all mt-6 shadow-xl shadow-white/5 uppercase">
                                                                Export Settlement
                                                            </Button>
                                                        </CardContent>
                                                    </Card>

                                                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                                                        <CardHeader className="p-10 pb-4">
                                                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-[#F2A93B]">Payout Strategy</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="p-10 pt-4 space-y-4">
                                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                                                                    <DollarSign className="w-5 h-5 text-emerald-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase">Method</p>
                                                                    <p className="text-[11px] font-black text-slate-900">Direct Deposit</p>
                                                                </div>
                                                            </div>
                                                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                                                                    <Calendar className="w-5 h-5 text-slate-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase">Next Date</p>
                                                                    <p className="text-[11px] font-black text-slate-900">Feb 1, 2026</p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                <div className="lg:col-span-3">
                                                    <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                                                        <div className="p-10 flex items-center justify-between border-b border-slate-50">
                                                            <div>
                                                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight text-slate-900">Settlement Ledger</h4>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed service rewards for {format(selectedDate, "MMM yyyy")}</p>
                                                            </div>
                                                            <Button variant="ghost" className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all">
                                                                Filter by Service
                                                            </Button>
                                                        </div>
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                                                                    <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Operation / Client</TableHead>
                                                                    <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Resource Revenue</TableHead>
                                                                    <TableHead className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Commission Share</TableHead>
                                                                    <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settlement</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {recentCustomers.map((log, i) => (
                                                                    <TableRow key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-all">
                                                                        <TableCell className="px-10 py-6">
                                                                            <span className="font-black text-slate-900 uppercase text-[11px]">{log.service_name}</span>
                                                                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{log.full_name || "Unknown Identity"} • {format(new Date(log.booking_date), "MMM dd")}</p>
                                                                        </TableCell>
                                                                        <TableCell className="px-6 py-6 font-bold text-slate-600">RM {log.price}</TableCell>
                                                                        <TableCell className="px-6 py-6 font-bold text-slate-400">{staff.commission_percentage}%</TableCell>
                                                                        <TableCell className="px-10 py-6 text-right font-black text-emerald-500">
                                                                            +RM {(log.price * (staff.commission_percentage / 100)).toFixed(2)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </Card>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="attendance" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                <div className="lg:col-span-1 space-y-8">
                                                    <Card className="rounded-[2.5rem] bg-white overflow-hidden shadow-sm border-none">
                                                        <CardHeader className="p-10 pb-4">
                                                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Work Integrity</CardTitle>
                                                            <CardDescription className="text-xs font-bold text-slate-400">Efficiency and punctuality metrics.</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="p-10 pt-4 space-y-8">
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Punctuality Score</span>
                                                                    <span className="text-xs font-black text-emerald-500">92%</span>
                                                                </div>
                                                                <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: '92%' }}
                                                                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 text-center">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Days Present</p>
                                                                    <p className="text-2xl font-black text-slate-900">{stats?.days_worked || 0}</p>
                                                                </div>
                                                                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 text-center">
                                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Output</p>
                                                                    <p className="text-2xl font-black text-slate-900">{stats?.total_hours || 0}h</p>
                                                                </div>
                                                            </div>

                                                            <div className="pt-6 border-t border-slate-50 space-y-4">
                                                                {[
                                                                    { label: 'Avg Check-In', val: '08:52 AM', color: 'text-emerald-500' },
                                                                    { label: 'Avg Check-Out', val: '06:14 PM', color: 'text-[#F2A93B]' },
                                                                    { label: 'Break Utilization', val: '45 Mins', color: 'text-slate-500' },
                                                                ].map(item => (
                                                                    <div key={item.label} className="flex justify-between items-center">
                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                                                        <span className={cn("text-xs font-black", item.color)}>{item.val}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                <div className="lg:col-span-2">
                                                    <Card className="rounded-[2.5rem] bg-white border-none shadow-sm overflow-hidden h-full">
                                                        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                                                            <h5 className="text-sm font-black uppercase tracking-widest text-slate-900">Deployment Matrix (Monthly View)</h5>
                                                            <Badge variant="outline" className="text-[8px] font-black text-[#F2A93B] border-[#F2A93B]/20 uppercase px-3 py-1">Shift Type: Fixed 9-6</Badge>
                                                        </div>
                                                        <div className="p-10 overflow-x-auto">
                                                            <div className="grid grid-cols-7 gap-4 min-w-[700px]">
                                                                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                                                                    <div key={day} className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest pb-4">{day}</div>
                                                                ))}
                                                                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                                                    const isActive = day < 20 && day % 3 !== 2;
                                                                    const isWeekend = (day + 1) % 7 === 0 || day % 7 === 0;
                                                                    return (
                                                                        <div key={day} className={cn(
                                                                            "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer relative",
                                                                            isWeekend ? "bg-slate-50/50 border-slate-50 opacity-20" : "bg-white border-slate-50 hover:border-slate-900",
                                                                            isActive && !isWeekend && "border-white bg-[#F2A93B]/5 ring-1 ring-[#F2A93B]/20"
                                                                        )}>
                                                                            <span className={cn("text-xs font-black", isActive && !isWeekend ? "text-[#F2A93B]" : "text-slate-400")}>{day}</span>
                                                                            {isActive && !isWeekend && (
                                                                                <div className="flex gap-1">
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-30" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="leaves" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Absence Dossier</h4>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Registry of time-off allocations and pending requests.</p>
                                                </div>
                                                <Button className="h-14 px-10 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center gap-4">
                                                    <Plus className="w-5 h-5" /> Initialize New Lock-off
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                                {leaves.map((leave, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: i * 0.1 }}
                                                    >
                                                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-2xl transition-all duration-300">
                                                            <div className={cn("h-3 w-full", leave.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500')} />
                                                            <CardContent className="p-10">
                                                                <div className="flex items-center justify-between mb-8">
                                                                    <Badge className={cn("rounded-full px-5 py-1.5 text-[9px] font-black uppercase tracking-widest border-none shadow-sm", getLeaveBadgeColor(leave.status))}>
                                                                        {leave.status}
                                                                    </Badge>
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{leave.leave_type}</span>
                                                                </div>

                                                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 mb-8">
                                                                    <div className="text-center">
                                                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Departure</p>
                                                                        <p className="text-sm font-black text-slate-900">{format(new Date(leave.start_date), "MMM dd, yy")}</p>
                                                                    </div>
                                                                    <ArrowRightLeft className="w-6 h-6 text-slate-200" />
                                                                    <div className="text-center">
                                                                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Return</p>
                                                                        <p className="text-sm font-black text-slate-900">{format(new Date(leave.end_date), "MMM dd, yy")}</p>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Reason Narrative</p>
                                                                    <p className="text-xs font-bold text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl italic border border-slate-100/50">
                                                                        "{leave.reason || "Operational narrative not provided for this specific deployment pause."}"
                                                                    </p>
                                                                </div>

                                                                <div className="mt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button variant="ghost" className="flex-1 h-10 text-[9px] font-black uppercase text-slate-400 hover:text-rose-500 rounded-xl">Revoke</Button>
                                                                    <Button variant="ghost" className="flex-1 h-10 text-[9px] font-black uppercase text-slate-400 hover:text-slate-900 rounded-xl">Details</Button>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </motion.div>
                                                ))}

                                                {leaves.length === 0 && (
                                                    <div className="col-span-full py-32 text-center space-y-6 rounded-[3rem] border-4 border-dashed border-slate-100 bg-white/50">
                                                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                                                            <Calendar className="w-10 h-10 text-slate-200" />
                                                        </div>
                                                        <div>
                                                            <p className="text-lg font-black text-slate-900 uppercase tracking-tight">Zero Registry</p>
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No absence deployments synchronized for this staff operative.</p>
                                                        </div>
                                                        <Button variant="outline" className="h-12 px-8 border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white transition-all">
                                                            Pre-authorize Absences
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="customers" className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden">
                                                <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div>
                                                        <h4 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Clients Registry</h4>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed fulfillment history for this specific staff member.</p>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                                            <input
                                                                type="text"
                                                                placeholder="Search Clients..."
                                                                className="h-12 pl-12 pr-6 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 ring-[#F2A93B]/20 transition-all w-64"
                                                            />
                                                        </div>
                                                        <Button className="h-12 px-6 bg-[#F2A93B]/10 text-[#F2A93B] hover:bg-[#F2A93B]/20 rounded-2xl transition-all">
                                                            <Plus className="w-5 h-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-none">
                                                            <TableHead className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Professional Deployment</TableHead>
                                                            <TableHead className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Operation Profile</TableHead>
                                                            <TableHead className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Fulfillment Status</TableHead>
                                                            <TableHead className="px-10 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Value Yield</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {recentCustomers.map((log, i) => (
                                                            <TableRow key={i} className="border-b border-slate-50 hover:bg-slate-50/30 transition-all group cursor-pointer">
                                                                <TableCell className="px-10 py-8">
                                                                    <div className="flex items-center gap-5">
                                                                        <div className="w-14 h-14 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-slate-900/10 group-hover:scale-105 transition-transform">
                                                                            {log.full_name?.charAt(0) || "U"}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.full_name || "Unknown Identity"}</p>
                                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                                                                                <MapPin className="w-3 h-3 text-[#F2A93B]" /> Verified Account
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="px-10 py-8">
                                                                    <Badge variant="outline" className="rounded-xl border-slate-200 text-slate-700 text-[9px] font-black uppercase tracking-[0.1em] px-4 py-2 bg-white flex items-center w-fit gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#F2A93B]" />
                                                                        {log.service_name}
                                                                    </Badge>
                                                                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{format(new Date(log.booking_date), "EEEE, MMM dd, yyyy")}</p>
                                                                </TableCell>
                                                                <TableCell className="px-10 py-8">
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between items-center w-24">
                                                                            <span className="text-[8px] font-black text-slate-300 uppercase">Progress</span>
                                                                            <span className="text-[8px] font-black text-emerald-500 uppercase">100%</span>
                                                                        </div>
                                                                        <div className="h-1 w-24 bg-slate-50 rounded-full overflow-hidden">
                                                                            <div className="h-full bg-emerald-500 w-full" />
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="px-10 py-8 text-right">
                                                                    <p className="text-xl font-black text-slate-900 tracking-tight">RM {log.price}</p>
                                                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Captured</p>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {recentCustomers.length === 0 && (
                                                            <TableRow>
                                                                <TableCell colSpan={4} className="h-96 text-center">
                                                                    <div className="flex flex-col items-center justify-center space-y-6 opacity-40 py-20">
                                                                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                                                                            <Users className="w-12 h-12 text-slate-200" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xl font-black text-slate-900 uppercase tracking-tight">No Historical Deployments</p>
                                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2">This staff member hasn't handled any recorded client sessions yet.</p>
                                                                        </div>
                                                                        <Button variant="outline" className="h-12 px-8 border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest">Manual History Entry</Button>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                                <div className="p-8 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Showing {recentCustomers.length} Operational Records</span>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" className="w-10 h-10 rounded-xl hover:bg-white shadow-sm transition-all"><ChevronRight className="w-4 h-4 rotate-180" /></Button>
                                                        <Button variant="ghost" size="sm" className="w-10 h-10 rounded-xl bg-white shadow-sm text-slate-900 font-bold text-xs border border-slate-100">1</Button>
                                                        <Button variant="ghost" size="sm" className="w-10 h-10 rounded-xl hover:bg-white shadow-sm transition-all"><ChevronRight className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </TabsContent>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </Tabs>
                </div>
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md rounded-[3rem] border-none shadow-2xl p-10 bg-white">
                    <DialogHeader className="space-y-4">
                        <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight uppercase">Edit Profile</DialogTitle>
                        <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                            Update the operational parameters for this staff operative.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-6 pt-6">
                        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6 scrollbar-hide">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Identity</Label>
                                <Input
                                    value={editForm.display_name}
                                    onChange={e => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                                    className="h-12 bg-slate-50 border-none rounded-2xl font-bold px-5"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Terminal</Label>
                                    <Input
                                        type="email"
                                        value={editForm.email}
                                        onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="h-12 bg-slate-50 border-none rounded-2xl font-bold px-5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Comms (Phone)</Label>
                                    <Input
                                        value={editForm.phone}
                                        onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                        className="h-12 bg-slate-50 border-none rounded-2xl font-bold px-5"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Security Access Pass (Password)</Label>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={editForm.password}
                                        onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder="Leave blank to keep current"
                                        className="h-12 bg-slate-50 border-none rounded-2xl font-bold px-5 pr-12"
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hierarchy Role</Label>
                                    <Select
                                        value={editForm.role}
                                        onValueChange={val => setEditForm(prev => ({ ...prev, role: val }))}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50 border-none rounded-2xl font-bold px-5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                            <SelectItem value="staff">Staff Operative</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Yield Share (%)</Label>
                                    <Input
                                        type="number"
                                        value={editForm.commission_percentage}
                                        onChange={e => setEditForm(prev => ({ ...prev, commission_percentage: Number(e.target.value) }))}
                                        className="h-12 bg-slate-50 border-none rounded-2xl font-bold px-5"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#F2A93B] ml-1">Assigned Services</Label>
                                <div className="grid grid-cols-1 gap-3 mt-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                                    {allServices.map((service) => (
                                        <div key={service.id} className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#F2A93B]/30 transition-all">
                                            <Checkbox
                                                id={`service-${service.id}`}
                                                checked={editForm.assigned_services.includes(service.id)}
                                                onCheckedChange={(checked) => {
                                                    setEditForm(prev => ({
                                                        ...prev,
                                                        assigned_services: checked
                                                            ? [...prev.assigned_services, service.id]
                                                            : prev.assigned_services.filter(id => id !== service.id)
                                                    }));
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <Label
                                                    htmlFor={`service-${service.id}`}
                                                    className="text-[11px] font-black text-slate-700 uppercase cursor-pointer block truncate"
                                                >
                                                    {service.name}
                                                </Label>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{service.category || 'General'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <div className="space-y-0.5">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-none">Operational Status</Label>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active deployment toggle</p>
                                </div>
                                <Switch
                                    checked={editForm.is_active}
                                    onCheckedChange={checked => setEditForm(prev => ({ ...prev, is_active: checked }))}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-6 gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsEditDialogOpen(false)}
                                className="h-14 flex-1 font-black text-[10px] uppercase tracking-widest text-slate-400"
                            >
                                Abort
                            </Button>
                            <Button
                                type="submit"
                                disabled={isUpdating}
                                className="h-14 flex-1 bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl transition-all"
                            >
                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </ResponsiveDashboardLayout>
    );
}

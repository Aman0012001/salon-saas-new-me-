import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Banknote,
  Users,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Plus,
  Star,
  Activity,
  Zap,
  CheckCircle,
  XCircle,
  User,
  Bell,
  AlertCircle,
  RefreshCw,
  Scissors,
  Store,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  BarChart3,
  Users2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import { useMobile } from "@/hooks/use-mobile";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { StaffDashboard } from "@/components/dashboard/StaffDashboard";

interface DashboardStats {
  todayAppointments: number;
  todayRevenue: number;
  totalCustomers: number;
  pendingAppointments: number;
  newBookingsCount: number;
}

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes: string | null;
  user_id: string;
  service_id: string;
  salon_id: string;
  created_at: string;
  updated_at: string;
  service_name?: string;
  price?: number;
  duration_minutes?: number;
  user_name?: string;
  user_phone?: string;
  user_avatar?: string;
  service: {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
  } | null;
  customer: {
    user_id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  customerType?: 'new' | 'returning';
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentSalon, loading: salonLoading, isOwner: salonOwnerRole, isStaff: salonStaffRole, subscription } = useSalon();

  const isOwner = user?.user_type === 'salon_owner' || salonOwnerRole || (user?.salon_role && ['owner', 'manager'].includes(user.salon_role));
  const isStaff = user?.user_type === 'salon_staff' || salonStaffRole || user?.salon_role === 'staff';

  const isMobile = useMobile();
  const { toast } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    todayRevenue: 0,
    totalCustomers: 0,
    pendingAppointments: 0,
    newBookingsCount: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refreshBookings = useCallback(async (manual = false) => {
    if (!currentSalon) return;

    if (manual) setRefreshing(true);
    try {
      const todayDate = format(new Date(), "yyyy-MM-dd");
      const allBookings = await api.bookings.getAll({ salon_id: currentSalon.id });

      const enrich = (list: any[]) => list.map(b => ({
        ...b,
        user_name: b.full_name || b.user_name,
        user_phone: b.phone || b.user_phone,
        service: b.service_name ? {
          id: b.service_id,
          name: b.service_name,
          price: Number(b.price || 0),
          duration_minutes: Number(b.duration_minutes || 30)
        } : null,
        customer: (b.full_name || b.user_name) ? {
          user_id: b.user_id,
          full_name: b.full_name || b.user_name,
          phone: b.phone || b.user_phone,
          avatar_url: b.user_avatar || null
        } : null,
        customerType: 'returning'
      }));

      const bookingsArray = allBookings;

      const enrichedAll = enrich(bookingsArray as any[]);
      const recent = enrichedAll.slice(0, 8);
      const today = enrichedAll.filter(b => b.booking_date === todayDate && b.status !== 'cancelled');
      const pending = enrichedAll.filter(b => b.status === "pending");

      const confirmedToday = today.filter(b => b.status === "confirmed" || b.status === "completed");
      const todayRevenue = confirmedToday.reduce((sum, b) => sum + Number(b.price || b.service?.price || 0), 0);
      const uniqueCustomerCount = new Set(enrichedAll.map(b => b.user_id)).size;

      setRecentBookings(recent);
      setPendingBookings(pending);

      setStats({
        todayAppointments: today.length,
        todayRevenue,
        totalCustomers: uniqueCustomerCount,
        pendingAppointments: pending.length,
        newBookingsCount: pending.filter(b => isToday(new Date(b.created_at || ''))).length,
      });

      setLastRefresh(new Date());

      if (manual) {
        toast({
          title: "Data Refreshed",
          description: "Your dashboard has been updated with the latest records.",
        });
      }
    } catch (error) {
      console.error("Dashboard refresh error:", error);
    } finally {
      if (manual) setRefreshing(false);
    }
  }, [currentSalon, toast]);

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      await api.bookings.updateStatus(bookingId, newStatus);
      await refreshBookings();
      toast({
        title: newStatus === 'confirmed' ? "Booking Confirmed" : "Booking Cancelled",
        description: `Status updated successfully.`,
      });
    } catch (error) {
      console.error("Status update error:", error);
    }
  };


  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
      } else {
        const isStaffOrOwner = user.salon_role === 'staff' || user.salon_role === 'owner' || user.salon_role === 'manager' || user.user_type === 'salon_owner' || user.user_type === 'salon_staff' || user.user_type === 'admin';

        if (user.user_type === 'customer' && !isStaffOrOwner) {
          navigate("/");
        }
      }
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!currentSalon) {
      if (!salonLoading) setLoading(false);
      return;
    }
    refreshBookings().finally(() => setLoading(false));

    const interval = setInterval(() => refreshBookings(), 60000);
    return () => clearInterval(interval);
  }, [currentSalon, refreshBookings]);

  if (authLoading || salonLoading) {
    return (
      <ResponsiveDashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Dashboard...</p>
        </div>
      </ResponsiveDashboardLayout>
    );
  }

  if (!currentSalon) {
    return (
      <ResponsiveDashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-8 px-6">
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-150" />
            <div className="relative w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl border border-slate-100">
              <Store className="w-10 h-10 text-slate-300" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {isStaff ? "Account Initialized" : "No Salon Linked"}
            </h2>
            <p className="text-slate-500 font-medium max-w-sm mx-auto">
              {isStaff
                ? "Your staff account is ready. Please wait for your salon administrator to link you to their workspace."
                : "Please link your salon to start managing your business."}
            </p>
          </div>
          {!isStaff && (
            <Button onClick={() => navigate("/salon/create-salon")} className="bg-[#F2A93B] text-white rounded-2xl h-14 px-10 font-bold shadow-xl transition-all transform hover:scale-105">
              Create Your Salon
            </Button>
          )}
        </div>
      </ResponsiveDashboardLayout>
    );
  }

  const statCards = [
    {
      title: "Pending Requests",
      value: stats.pendingAppointments,
      icon: Clock,
      label: stats.newBookingsCount > 0 ? `${stats.newBookingsCount} new today` : "No new requests",
      color: "bg-[#F2A93B]",
      iconColor: "text-white",
      accent: true,
    },
    {
      title: "Today's Bookings",
      value: stats.todayAppointments,
      icon: Calendar,
      label: "Confirmed appointments",
      color: "bg-white",
      iconColor: "text-slate-400",
    },
    {
      title: "Daily Revenue",
      value: `RM ${new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(stats.todayRevenue)}`,
      icon: Banknote,
      label: "Revenue generated today",
      color: "bg-white",
      iconColor: "text-slate-400",
    },
    {
      title: "Active Customers",
      value: stats.totalCustomers,
      icon: Users,
      label: "Total customer base",
      color: "bg-white",
      iconColor: "text-slate-400",
    },
  ];

  if (isStaff) {
    return (
      <ResponsiveDashboardLayout>
        <div className="py-6 px-4">
          <StaffDashboard />
        </div>
      </ResponsiveDashboardLayout>
    );
  }

  return (
    <ResponsiveDashboardLayout>
      <div className="max-w-[1400px] mx-auto space-y-6 py-6 px-4">
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F2A93B] rounded-2xl flex items-center justify-center shadow-lg overflow-hidden group">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Business Overview</h1>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>{currentSalon.name}</span>
                  <div className="w-1 h-1 bg-slate-200 rounded-full" />
                  <p className="flex items-center gap-1.5 transition-colors">
                    <Clock className="w-3 h-3 text-accent" />
                    Last Updated: {format(lastRefresh, 'HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => refreshBookings(true)}
              disabled={refreshing}
              className="h-12 w-12 rounded-xl border-slate-200 bg-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => navigate("/salon/appointments")}
              className="h-12 px-6 bg-[#F2A93B] hover:bg-[#E29A2B] text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Booking
            </Button>
          </div>
        </div>

        {/* Modular Stat Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "border-none shadow-[0_15px_40px_-15px_rgba(0,0,0,0.04)] rounded-[2rem] overflow-hidden transition-all hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)]",
                stat.color === 'bg-[#F2A93B]' || stat.color === 'bg-slate-900' ? 'bg-[#F2A93B] text-white' : 'bg-white'
              )}>
                <CardContent className="p-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      stat.color === 'bg-[#F2A93B]' || stat.color === 'bg-slate-900' ? 'bg-white/20' : 'bg-slate-50'
                    )}>
                      <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
                    </div>
                    {stat.accent && <div className={cn("w-2 h-2 rounded-full animate-pulse", stat.color === 'bg-[#F2A93B]' ? 'bg-white' : 'bg-accent')} />}
                  </div>
                  <div className="space-y-0.5">
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      stat.color !== 'bg-white' ? 'text-white/70' : 'text-slate-400'
                    )}>{stat.title}</p>
                    <p className="text-2xl font-bold tracking-tight">
                      {loading ? "..." : stat.value}
                    </p>
                  </div>
                  <div className={cn(
                    "text-[10px] font-semibold",
                    stat.color !== 'bg-white' ? 'text-white/90' : stat.accent ? 'text-accent' : 'text-slate-400'
                  )}>
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Queue */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-900 leading-none">Live Queue</h3>
                <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20 font-bold px-2 py-0.5">
                  {pendingBookings.length} Awaiting
                </Badge>
              </div>
              <Button variant="ghost" onClick={() => navigate("/salon/appointments")} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-transparent">
                View Register <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {pendingBookings.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-16 text-center bg-slate-50/50 rounded-[2rem] border border-slate-100">
                    <ShieldCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-semibold text-xs uppercase tracking-wider">No pending requests at the moment</p>
                  </motion.div>
                ) : (
                  pendingBookings.slice(0, 4).map((booking, idx) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group p-5 bg-white rounded-2xl border border-slate-100 hover:border-accent/10 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-14 h-14 rounded-xl border border-slate-100 shadow-sm">
                            <AvatarFallback className="bg-[#F2A93B] text-white font-bold text-lg">
                              {(() => {
                                const walkInMatch = booking.notes?.match(/Walk-in:\s*([^|#\n]+)/);
                                if (walkInMatch && walkInMatch[1].trim() && walkInMatch[1].trim() !== "undefined") {
                                  return walkInMatch[1].trim().charAt(0).toUpperCase();
                                }
                                return (booking.user_name || "G").charAt(0).toUpperCase();
                              })()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-base">
                                {(() => {
                                  const walkInMatch = booking.notes?.match(/Walk-in:\s*([^|#\n]+)/);
                                  if (walkInMatch && walkInMatch[1].trim() && walkInMatch[1].trim() !== "undefined") {
                                    return walkInMatch[1].trim();
                                  }

                                  if (booking.user_name && (booking.user_id === user?.id || booking.user_name === user?.full_name)) {
                                    return "Walk-in Customer";
                                  }

                                  return booking.user_name || "Guest";
                                })()}
                              </h4>
                              {booking.notes?.includes("Walk-in:") && (
                                <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-bold uppercase tracking-widest px-1.5 h-4">
                                  Walk-in
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{booking.service_name}</span>
                              <div className="w-1 h-1 bg-slate-200 rounded-full" />
                              <span className="text-[10px] font-bold text-accent">{formatBookingTime(booking.booking_date, booking.booking_time)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="icon" onClick={() => updateBookingStatus(booking.id, 'confirmed')} className="w-12 h-12 bg-[#F2A93B] hover:bg-[#E29A2B] text-white rounded-xl shadow-md transition-all">
                            <CheckCircle className="w-5 h-5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => updateBookingStatus(booking.id, 'cancelled')} className="w-12 h-12 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                            <XCircle className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="space-y-6">
            <div className="px-2">
              <h3 className="text-xl font-bold text-slate-900">Manage Business</h3>
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Direct access to controls</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "Our Services", icon: Scissors, path: "/salon/services", desc: "Manage treatment catalog", color: "text-orange-500", bg: "bg-orange-50" },
                { label: "Team Management", icon: Users2, path: "/salon/staff", desc: "Staff & specialist profiles", color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Customer List", icon: Users, path: "/salon/customers", desc: "View customer history", color: "text-purple-500", bg: "bg-purple-50" },
                { label: "Analytics", icon: BarChart3, path: "/salon/reports", desc: "Performance reports", color: "text-emerald-500", bg: "bg-emerald-50" },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="p-5 bg-white rounded-2xl border border-slate-100 flex items-center gap-4 text-left group transition-all hover:bg-slate-50 hover:shadow-md"
                >
                  <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <span className="font-bold text-slate-900 text-sm tracking-tight leading-none">{item.label}</span>
                    <p className="text-[10px] font-medium text-slate-400">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>


            {!isOwner && !isStaff && (
              <Card className="border-none bg-[#F2A93B] rounded-[2rem] p-7 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-white/20 rounded-xl text-white">
                      <Zap className="w-4 h-4" />
                    </div>
                    <Badge className="bg-white/20 text-white border-0 font-bold text-[9px] px-2 py-0.5 tracking-wider">REVENUE ACTIVE</Badge>
                  </div>
                  <div className="space-y-1 text-white">
                    <h4 className="font-bold text-sm">System Healthy</h4>
                    <p className="text-[10px] font-medium text-white/80 leading-relaxed">Your salon dashboard is currently syncing live booking data.</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ResponsiveDashboardLayout>
  );

  function formatBookingTime(date: string, time: string) {
    try {
      const bookingDate = parseISO(date);
      const bookingDateTime = new Date(bookingDate);
      const [h, m] = time.split(':');
      bookingDateTime.setHours(parseInt(h), parseInt(m));
      return isToday(bookingDate) ? `at ${format(bookingDateTime, 'h:mm a')}` : `${format(bookingDate, 'MMM d')} @ ${format(bookingDateTime, 'h:mm a')}`;
    } catch {
      return `${date} at ${time}`;
    }
  }
}

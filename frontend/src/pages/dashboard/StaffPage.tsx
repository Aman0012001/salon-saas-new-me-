import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  Plus,
  Edit2,
  ChevronDown,
  Mail,
  Phone,
  Settings2,
  MoreVertical,
  ChevronRight,
  UserCircle,
  History,
  Layout,
  Eye,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { useSalon } from "@/hooks/useSalon";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { StaffMember } from "@/types/staff";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { AddStaffDialog } from "@/components/staff/AddStaffDialog";
import { EditStaffDialog } from "@/components/staff/EditStaffDialog";
import { cn } from "@/lib/utils";

export default function StaffPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { currentSalon, loading: salonLoading, isOwner, isManager, subscription, refreshSalons } = useSalon();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "TERMINATED" | "STAFF">("ACTIVE");
  const [subTab, setSubTab] = useState<"DETAILS" | "LOGS">("DETAILS");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchStaff = useCallback(async () => {
    if (!currentSalon) {
      if (!salonLoading) setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const staffData = await api.staff.getBySalon(currentSalon.id);

      if (!Array.isArray(staffData)) {
        setStaff([]);
        return;
      }

      setStaff(staffData);
      if (staffData.length > 0 && !selectedStaffId) {
        setSelectedStaffId(staffData[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Could not access team records.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentSalon, toast, selectedStaffId]);

  const handleDeleteStaff = async (id: string) => {
    try {
      await api.staff.delete(id);
      toast({
        title: "Staff Member Removed",
        description: "The staff record has been successfully deleted.",
      });
      fetchStaff();
      if (selectedStaffId === id) {
        setSelectedStaffId(null);
      }
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "Could not delete staff member.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const selectedStaff = useMemo(() => {
    return staff.find(s => s.id === selectedStaffId) || null;
  }, [staff, selectedStaffId]);

  const filteredStaff = useMemo(() => {
    return staff.filter(s => {
      const matchesStatus =
        activeTab === "ALL" ||
        (activeTab === "ACTIVE" && s.is_active) ||
        (activeTab === "INACTIVE" && !s.is_active) ||
        (activeTab === "TERMINATED" && false) || // Mocking terminated
        (activeTab === "STAFF" && s.role === "staff");

      const q = searchQuery.toLowerCase();
      const matchesSearch = s.display_name.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [staff, activeTab, searchQuery]);

  const counts = useMemo(() => ({
    ALL: staff.length,
    ACTIVE: staff.filter(s => s.is_active).length,
    INACTIVE: staff.filter(s => !s.is_active).length,
    TERMINATED: 0,
    STAFF: staff.filter(s => s.role === "staff").length,
  }), [staff]);

  if (authLoading || salonLoading) {
    return (
      <ResponsiveDashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] space-y-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#F2A93B] rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-white font-bold uppercase tracking-widest text-[10px]">Synchronizing Team Registry...</p>
        </div>
      </ResponsiveDashboardLayout>
    );
  }

  return (
    <ResponsiveDashboardLayout showBackButton={true}>
      <div className="min-h-screen bg-[#F8F9FA] pb-20">
        <div className="max-w-[1400px] mx-auto pt-8 px-6 space-y-8">

          {/* Top Status Tabs & Enhanced Filter */}
          <div className="flex items-center gap-4 mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-3 px-6 py-2.5 rounded-xl font-black text-xs tracking-[0.2em] transition-all bg-[#F2A93B] text-white shadow-lg shadow-[#F2A93B]/20 hover:scale-[1.02] active:scale-[0.98]",
                  )}
                >
                  <Layout className="w-3.5 h-3.5" />
                  {activeTab} <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 p-2 rounded-2xl border-none shadow-2xl bg-white/95 backdrop-blur-xl">
                <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Filter Registry</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />

                <DropdownMenuItem onClick={() => setActiveTab("ALL")} className="rounded-xl py-3 px-3 cursor-pointer focus:bg-[#F2A93B]/10 group">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-700 group-hover:text-[#F2A93B]">ALL PERSONNEL</span>
                    <span className="text-[10px] font-black text-slate-300">{counts.ALL}</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-100" />

                <DropdownMenuItem onClick={() => setActiveTab("ACTIVE")} className="rounded-xl py-3 px-3 cursor-pointer focus:bg-emerald-50 group">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-600 uppercase">Active</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-300">{counts.ACTIVE}</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setActiveTab("INACTIVE")} className="rounded-xl py-3 px-3 cursor-pointer focus:bg-slate-50 group">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 uppercase">Inactive</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-300">{counts.INACTIVE}</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setActiveTab("TERMINATED")} className="rounded-xl py-3 px-3 cursor-pointer focus:bg-rose-50 group">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="text-xs font-bold text-slate-700 group-hover:text-rose-600 uppercase">Terminated</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-300">{counts.TERMINATED}</span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-slate-100" />

                <DropdownMenuItem onClick={() => setActiveTab("STAFF")} className="rounded-xl py-3 px-3 cursor-pointer focus:bg-amber-50 group">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-700 group-hover:text-amber-600 uppercase tracking-tight">Service Staff</span>
                    <span className="text-[10px] font-black text-slate-300">{counts.STAFF}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-4 w-px bg-slate-200 mx-2" />

            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Showing {filteredStaff.length} Result{filteredStaff.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Featured Staff Card */}
          <AnimatePresence mode="wait">
            {selectedStaff && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="p-8 flex items-start gap-8 relative">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-2 border-slate-100 shadow-lg">
                      <AvatarImage src={selectedStaff.avatar_url || ""} />
                      <AvatarFallback className="bg-[#F2A93B] text-white text-2xl font-black">
                        {selectedStaff.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">{selectedStaff.display_name}</h2>
                      <p className="text-[#F2A93B] font-bold uppercase tracking-widest text-[10px]">{selectedStaff.role?.replace('_', ' ').toUpperCase() || "STAFF MEMBER"}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                      <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest min-w-[60px]">PHONET</span>
                        <span className="text-sm font-bold text-slate-600">: {selectedStaff.phone || "(Not Provided)"}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest min-w-[60px]">EMAIL</span>
                        <span className="text-sm font-bold text-slate-600">: {selectedStaff.email || "no-email@registry.com"}</span>
                      </div>

                    </div>
                  </div>

                  <div className="absolute top-8 right-8 flex gap-2">
                    <Button
                      onClick={() => navigate(`/salon/staff/${selectedStaff.id}`)}
                      className="bg-[#F2A93B] hover:bg-[#E29A2B] text-white font-bold h-10 px-8 rounded-md"
                    >
                      View
                    </Button>

                    {isOwner && (
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-2xl border-none">
                            <DropdownMenuItem
                              onClick={() => navigate(`/salon/staff/${selectedStaff.id}`)}
                              className="rounded-lg py-2.5 font-semibold"
                            >
                              <Eye className="w-4 h-4 mr-2 text-slate-400" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedStaffId(selectedStaff.id);
                                setIsEditOpen(true);
                              }}
                              className="rounded-lg py-2.5 font-semibold"
                            >
                              <Edit2 className="w-4 h-4 mr-2 text-blue-500" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="opacity-50" />
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-rose-50 rounded-lg py-2.5 font-bold">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Member
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black tracking-tight">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium">
                              This will permanently delete <span className="font-bold text-slate-900">{selectedStaff.display_name}</span> from your salon registry. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-xl font-bold border-slate-200">Cancel Action</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStaff(selectedStaff.id)}
                              className="bg-destructive hover:bg-destructive/90 text-white rounded-xl font-black"
                            >
                              Yes, Delete Member
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sub Tabs */}
          <div className="flex items-center border-b border-slate-200 mt-12 mb-6">
            <button
              onClick={() => setSubTab("DETAILS")}
              className={cn(
                "px-8 py-3 text-sm font-black tracking-widest transition-all relative",
                subTab === "DETAILS" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
            >
              DETAILS
              {subTab === "DETAILS" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F2A93B]" />}
            </button>
            <button
              onClick={() => setSubTab("LOGS")}
              className={cn(
                "px-8 py-3 text-sm font-black tracking-widest transition-all relative ml-4",
                subTab === "LOGS" ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
            >
              LOGS
              {subTab === "LOGS" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F2A93B]" />}
            </button>
          </div>

          {/* Table Controls (Mini) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-[#F2A93B]/10 text-[#F2A93B] rounded flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Search registry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 bg-slate-50 border-slate-100 rounded-md text-xs font-bold w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              {(isOwner || isManager) && currentSalon && (
                <div className="flex flex-col items-end gap-1">
                  {subscription && (
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      Plan limit: {subscription.current_staff_count} / {subscription.max_staff}
                    </span>
                  )}
                  <AddStaffDialog
                    salonId={currentSalon.id}
                    staffCount={staff.length}
                    onSuccess={async () => {
                      await fetchStaff();
                      await refreshSalons();
                    }}
                    trigger={
                      <Button
                        disabled={subscription ? subscription.current_staff_count >= subscription.max_staff : false}
                        className="h-10 bg-[#F2A93B] hover:bg-[#E29A2B] text-white font-bold rounded-md flex items-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Plus className="w-4 h-4" />
                        {subscription && subscription.current_staff_count >= subscription.max_staff
                          ? "Limit Reached"
                          : "Add Member"}
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F8F9FA] hover:bg-[#F8F9FA]">
                  <TableHead className="w-[50px]">
                    <Checkbox className="border-slate-300" />
                  </TableHead>
                  <TableHead className="text-[11px] font-black text-[#64748B] uppercase tracking-widest">
                    NAME
                  </TableHead>
                  <TableHead className="text-[11px] font-black text-[#64748B] uppercase tracking-widest">
                    POSITION
                  </TableHead>
                  <TableHead className="text-[11px] font-black text-[#64748B] uppercase tracking-widest">
                    WORK PHONE
                  </TableHead>
                  <TableHead className="text-[11px] font-black text-[#64748B] uppercase tracking-widest">
                    EMAIL
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                          <Users className="w-8 h-8" />
                        </div>
                        <p className="font-bold text-slate-400">No members found in this category.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.map((member) => (
                  <TableRow
                    key={member.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedStaffId === member.id ? "bg-slate-50/50" : "hover:bg-slate-50"
                    )}
                    onClick={() => setSelectedStaffId(member.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedStaffId === member.id}
                        onCheckedChange={() => setSelectedStaffId(member.id)}
                        className="border-slate-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-slate-100">
                          <AvatarImage src={member.avatar_url || ""} />
                          <AvatarFallback className="bg-[#F2A93B] text-white text-[10px] uppercase">
                            {member.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-slate-700">{member.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-medium italic">
                      {member.role?.replace('_', ' ').toLowerCase() || "staff"}
                    </TableCell>
                    <TableCell className="text-slate-600 font-bold">
                      {member.phone || "(Not Available)"}
                    </TableCell>
                    <TableCell className="text-slate-500 font-medium">
                      {member.email}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {selectedStaff && (
        <EditStaffDialog
          staff={selectedStaff}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={fetchStaff}
          canEditRole={isOwner}
        />
      )}
    </ResponsiveDashboardLayout>
  );
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
import { SalonProvider } from "@/hooks/useSalon";
import { SuperAdminProvider } from "@/hooks/useSuperAdmin";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import "@/utils/adminBypass"; // Auto-enable admin bypass
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BookAppointment from "./pages/BookAppointment";
import MyBookings from "./pages/MyBookings";
import UserProfile from "./pages/UserProfile";
import EditUserProfile from "./pages/EditUserProfile";
import ClinicalProfile from "./pages/ClinicalProfile";
import BookingTreatmentPage from "./pages/BookingTreatmentPage";
import NotFound from "./pages/NotFound";
import DashboardHome from "./pages/dashboard/DashboardHome";
import CreateSalon from "./pages/dashboard/CreateSalon";
import AppointmentsPage from "./pages/dashboard/AppointmentsPage";
import StaffPage from "./pages/dashboard/StaffPage";
import StaffDetailsPage from "./pages/dashboard/StaffDetailsPage";
import StaffAttendancePage from "./pages/dashboard/StaffAttendancePage";
import ServicesPage from "./pages/dashboard/ServicesPage";
import CustomersPage from "./pages/dashboard/CustomersPage";
import CustomerDetailsPage from "./pages/dashboard/CustomerDetailsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import BillingPage from "./pages/dashboard/BillingPage";
import InventoryPage from "./pages/dashboard/InventoryPage";
import ReportsPage from "./pages/dashboard/ReportsPage";
import OwnerProfile from "./pages/dashboard/OwnerProfile";
import OffersPage from "./pages/dashboard/OffersPage";
import NotificationsPage from "./pages/dashboard/NotificationsPage";
import StaffLeavesPage from "./pages/dashboard/StaffLeavesPage";
import StaffMessagesPage from "./pages/dashboard/StaffMessagesPage";
import LoyaltyPage from "./pages/dashboard/LoyaltyPage";
import KnowledgeBasePage from "./pages/dashboard/KnowledgeBasePage";
import SalonOwnerLogin from "./pages/SalonOwnerLogin";
import AboutUs from "./pages/AboutUs";
import SalonListing from "./pages/SalonListing";
import SalonServices from "./pages/SalonServices";
import AdminSetup from "./pages/AdminSetup";
import AllServicesSimple from "./pages/AllServicesSimple";
import ServiceDetail from "./pages/ServiceDetail";

import ContactUs from "./pages/ContactUs";
// Super Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDashboardEnhanced from "./pages/admin/AdminDashboardEnhanced";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminSalons from "./pages/admin/AdminSalons";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUsersEnhanced from "./pages/admin/AdminUsersEnhanced";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminPaymentsEnhanced from "./pages/admin/AdminPaymentsEnhanced";
import AdminMarketing from "./pages/admin/AdminMarketing";
import AdminReports from "./pages/admin/AdminReports";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminAddProduct from "./pages/admin/AdminAddProduct";
import AdminContactEnquiries from "./pages/admin/AdminContactEnquiries";
import AdminMembershipPlans from "./pages/admin/AdminMembershipPlans";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminOrdersPage from "./pages/AdminOrders";
import AdminAccess from "./pages/AdminAccess";
import SimpleAdminAccess from "./pages/SimpleAdminAccess";
import TestAdminLogin from "./pages/TestAdminLogin";
import DebugSupabase from "./pages/DebugSupabase";
import CreateAdminCredentials from "./pages/CreateAdminCredentials";
import DirectAdminAccess from "./pages/DirectAdminAccess";
import SupabaseDebug from "./pages/SupabaseDebug";
import CustomerSignup from "./pages/CustomerSignup";
import SalonOwnerSignup from "./pages/Signup";
import UnifiedSignup from "./pages/UnifiedSignup";
import ClientHub from "./pages/ClientHub";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SupplyStore from "./pages/dashboard/SupplyStore";
import RetailShop from "./pages/RetailShop";
import ProductDetails from "./pages/ProductDetails";
import SessionHistory from "./pages/SessionHistory";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import TestEmail from "./pages/TestEmail";
import { CartProvider } from "./context/CartContext";
import MembershipDetailsPage from "./pages/MembershipDetailsPage";
import NewsletterPopup from "./components/NewsletterPopup";
import SiteLoader from "./components/SiteLoader";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();

const App = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load or wait for resources
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AnimatePresence mode="wait">
        {isInitialLoading && <SiteLoader key="loader" />}
      </AnimatePresence>
      <AuthProvider>
        <NewsletterPopup />
        <SuperAdminProvider>

          <SalonProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <PWAInstallPrompt />
                <BrowserRouter>
                  <ScrollToTop />
                  <Routes>
                    <Route path="/" element={<AllServicesSimple />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/salons" element={<SalonListing />} />
                    <Route path="/salons/:id" element={<SalonServices />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/services/:id" element={<ServiceDetail />} />
                    <Route path="/services-simple" element={<AllServicesSimple />} />

                    <Route path="/shop" element={<RetailShop />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/contact" element={<ContactUs />} />
                    <Route path="/admin-setup" element={<AdminSetup />} />
                    <Route path="/admin-access" element={<SimpleAdminAccess />} />
                    <Route path="/admin-access-full" element={<AdminAccess />} />
                    <Route path="/test-admin" element={<TestAdminLogin />} />
                    <Route path="/debug-supabase" element={<DebugSupabase />} />
                    <Route path="/supabase-debug" element={<SupabaseDebug />} />
                    <Route path="/create-admin" element={<CreateAdminCredentials />} />
                    <Route path="/direct-admin" element={<DirectAdminAccess />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<CustomerSignup />} />
                    <Route path="/membership" element={<MembershipDetailsPage />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/salon-owner/signup" element={<SalonOwnerSignup />} />
                    <Route path="/salon-owner/login" element={<Login />} />
                    <Route path="/book" element={<BookAppointment />} />
                    <Route path="/book/:id" element={<BookAppointment />} />
                    <Route path="/test-email" element={<TestEmail />} />

                    {/* USER (Customer) Routes */}
                    <Route path="/user/dashboard" element={
                      <RoleProtectedRoute allowedRole="USER">
                        <ClientHub />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/my-bookings" element={
                      <RoleProtectedRoute allowedRole="USER">
                        <MyBookings />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/my-bookings/:id/treatment" element={
                      <RoleProtectedRoute allowedRole="USER">
                        <BookingTreatmentPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/user/profile" element={
                      <RoleProtectedRoute allowedRole="USER">
                        <UserProfile />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/user/profile/edit" element={
                      <RoleProtectedRoute allowedRole="USER">
                        <EditUserProfile />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/user/sessions" element={
                      <RoleProtectedRoute allowedRole="USER">
                        <SessionHistory />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/user/health" element={
                      <RoleProtectedRoute allowedRole="USER">
                        <ClinicalProfile />
                      </RoleProtectedRoute>
                    } />

                    {/* SALON_OWNER Routes */}
                    <Route path="/salon/dashboard" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <DashboardHome />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/create-salon" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <CreateSalon />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/appointments" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <AppointmentsPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/staff" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <StaffPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/staff/messages" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <StaffMessagesPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/staff/:id" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <StaffDetailsPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/services" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <ServicesPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/customers" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <CustomersPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/customers/:userId" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <CustomerDetailsPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/inventory" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <InventoryPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/reports" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <ReportsPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/billing" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <BillingPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/offers" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <OffersPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/settings" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <SettingsPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/notifications" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <NotificationsPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/salon/profile" element={
                      <RoleProtectedRoute allowedRole="SALON_OWNER">
                        <OwnerProfile />
                      </RoleProtectedRoute>
                    } />

                    {/* STAFF Routes */}
                    <Route path="/staff/dashboard" element={
                      <RoleProtectedRoute allowedRole="STAFF">
                        <DashboardHome />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/staff/attendance" element={
                      <RoleProtectedRoute allowedRole="STAFF">
                        <StaffAttendancePage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/staff/leaves" element={
                      <RoleProtectedRoute allowedRole="STAFF">
                        <StaffLeavesPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/staff/messages" element={
                      <RoleProtectedRoute allowedRole="STAFF">
                        <StaffMessagesPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/staff/customers" element={
                      <RoleProtectedRoute allowedRole="STAFF">
                        <CustomersPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/staff/customers/:userId" element={
                      <RoleProtectedRoute allowedRole="STAFF">
                        <CustomerDetailsPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/staff/profile/:id" element={
                      <RoleProtectedRoute allowedRole="STAFF">
                        <StaffDetailsPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/staff/notifications" element={
                      <RoleProtectedRoute allowedRole="STAFF">
                        <NotificationsPage />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/staff/profile" element={
                      <RoleProtectedRoute allowedRole="STAFF">
                        <Navigate to="/staff/dashboard" replace />
                      </RoleProtectedRoute>
                    } />

                    {/* SUPER_ADMIN Routes */}
                    <Route path="/super-admin/dashboard" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminDashboardEnhanced />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/salons" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminSalons />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/payments" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminPaymentsEnhanced />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/users" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminUsersEnhanced />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/plans" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminMembershipPlans />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/analytics" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminReports />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/marketing" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminMarketing />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/notifications" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminNotifications />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/products" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminProducts />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/products/add" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminAddProduct />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/contact-enquiries" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminContactEnquiries />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/members" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminMembers />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/reviews" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminReviews />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/settings" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminSettings />
                      </RoleProtectedRoute>
                    } />
                    <Route path="/super-admin/orders" element={
                      <RoleProtectedRoute allowedRole="SUPER_ADMIN">
                        <AdminOrdersPage />
                      </RoleProtectedRoute>
                    } />

                    {/* Fallbacks and Legacy Redirects */}
                    <Route path="/dashboard" element={<Navigate to="/salon/dashboard" replace />} />
                    <Route path="/dashboard/notifications" element={<Navigate to="/salon/notifications" replace />} />
                    <Route path="/dashboard/profile" element={<Navigate to="/salon/profile" replace />} />
                    <Route path="/dashboard/staff" element={<Navigate to="/salon/staff" replace />} />
                    <Route path="/dashboard/appointments" element={<Navigate to="/salon/appointments" replace />} />
                    <Route path="/dashboard/customers" element={<Navigate to="/salon/customers" replace />} />
                    <Route path="/dashboard/billing" element={<Navigate to="/salon/billing" replace />} />
                    <Route path="/dashboard/services" element={<Navigate to="/salon/services" replace />} />
                    <Route path="/dashboard/inventory" element={<Navigate to="/salon/inventory" replace />} />
                    <Route path="/dashboard/reports" element={<Navigate to="/salon/reports" replace />} />
                    <Route path="/dashboard/offers" element={<Navigate to="/salon/offers" replace />} />
                    <Route path="/dashboard/settings" element={<Navigate to="/salon/settings" replace />} />
                    <Route path="/dashboard/create-salon" element={<Navigate to="/salon/create-salon" replace />} />
                    <Route path="/admin" element={<Navigate to="/super-admin/dashboard" replace />} />
                    <Route path="/client-hub" element={<Navigate to="/user/dashboard" replace />} />

                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </CartProvider>
          </SalonProvider>
        </SuperAdminProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

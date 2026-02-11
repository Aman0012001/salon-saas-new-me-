// API Service for PHP/MySQL Backend
// This replaces Supabase client calls

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://localhost:8000/backend/api`;

// Helper function to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token');
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`[API Fetch] ${options.method || 'GET'} ${API_BASE_URL}${url}`);

    // Create an AbortController for a 15-second timeout
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            headers,
            signal: controller.signal
        });
        clearTimeout(id);

        if (!response.ok) {
            const resJson = await response.json().catch(() => ({ error: 'Request failed' }));
            const errorData = resJson.data || resJson;
            console.error(`[API Error] Status: ${response.status}`, errorData);
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const json = await response.json();
        return json.data !== undefined ? json.data : json;
    } catch (err: any) {
        clearTimeout(id);
        if (err.name === 'AbortError') {
            console.error(`[API Timeout Error] Request to ${url} timed out after 8s`);
            throw new Error('Server request timed out. Please check if backend is running.');
        }
        console.error(`[API Network Error] ${err.message}`);
        throw err;
    }
};

const fetchWithFileUpload = async (url: string, formData: FormData) => {
    const token = getAuthToken();
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            body: formData,
            headers,
        });

        if (!response.ok) {
            const resJson = await response.json().catch(() => ({ error: 'Upload failed' }));
            const errorData = resJson.data || resJson;
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const json = await response.json();
        return json.data !== undefined ? json.data : json;
    } catch (err: any) {
        console.error(`[API Upload Error] ${err.message}`);
        throw err;
    }
};

// Authentication API
export const authAPI = {
    async signup(email: string, password: string, full_name: string, extraData: any = {}) {
        const data = await fetchWithAuth('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, full_name, ...extraData }),
        });
        if (data && data.token) {
            localStorage.setItem('auth_token', data.token);
        }
        return data;
    },

    async login(email: string, password: string) {
        const data = await fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (data && data.token) {
            localStorage.setItem('auth_token', data.token);
        }
        return data;
    },

    async logout() {
        // Optional: notify backend
        localStorage.removeItem('auth_token');
    },

    async getCurrentUser() {
        return await fetchWithAuth('/auth/me');
    },

    async forgotPassword(email: string) {
        return await fetchWithAuth('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    async resetPassword(token: string, password: string) {
        return await fetchWithAuth('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        });
    },
};

// Helper to ensure we always have an array
const toArray = (data: any, key?: string) => {
    if (Array.isArray(data)) return data;
    if (key && data && Array.isArray(data[key])) return data[key];
    if (data && typeof data === 'object' && !data.error) {
        // If it's a single object that's not an error, maybe wrap it? 
        // No, usually we expect a list. If it's an error object, we return empty.
    }
    return [];
};

// Salons API
export const salonsAPI = {
    async getAll() {
        try {
            const data = await fetchWithAuth('/salons');
            console.log('[salonsAPI.getAll] Raw response:', data);

            // Handle different response formats
            if (Array.isArray(data)) {
                return data;
            }
            if (data && Array.isArray(data.salons)) {
                return data.salons;
            }

            console.warn('[salonsAPI.getAll] Unexpected response format:', data);
            return [];
        } catch (error) {
            console.error('[salonsAPI.getAll] Error:', error);
            return [];
        }
    },

    async getById(id: string) {
        const data = await fetchWithAuth(`/salons/${id}`);
        return data?.salon || data;
    },

    async getMySalons() {
        const data = await fetchWithAuth('/salons/my');
        return toArray(data, 'salons');
    },

    async create(salonData: any) {
        const data = await fetchWithAuth('/salons', {
            method: 'POST',
            body: JSON.stringify(salonData),
        });
        return data?.salon || data;
    },

    async update(id: string, salonData: any) {
        const data = await fetchWithAuth(`/salons/${id}`, {
            method: 'PUT',
            body: JSON.stringify(salonData),
        });
        return data?.salon || data;
    },

    async getAnalytics(id: string) {
        return await fetchWithAuth(`/salons/${id}/analytics`);
    },
};

// Services API
export const servicesAPI = {
    async getAll() {
        const data = await fetchWithAuth('/services');
        return toArray(data, 'services');
    },

    async getCategories() {
        const data = await fetchWithAuth('/services/categories');
        return toArray(data, 'categories');
    },

    async getBySalon(salonId: string, includeInactive: boolean = false) {
        const url = `/services?salon_id=${salonId}${includeInactive ? '&include_inactive=1' : ''}`;
        const data = await fetchWithAuth(url);
        return toArray(data, 'services');
    },

    async getById(id: string) {
        const data = await fetchWithAuth(`/services/${id}`);
        return data?.service || data;
    },

    async create(serviceData: any) {
        return await fetchWithAuth('/services', {
            method: 'POST',
            body: JSON.stringify(serviceData),
        });
    },

    async update(id: string, serviceData: any) {
        return await fetchWithAuth(`/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(serviceData),
        });
    },

    async delete(id: string) {
        await fetchWithAuth(`/services/${id}`, { method: 'DELETE' });
    },
};

// Bookings API
export const bookingsAPI = {
    async getAll(filters?: { user_id?: string; salon_id?: string; staff_id?: string; status?: string; date?: string; start_date?: string; end_date?: string }) {
        const params = new URLSearchParams(filters as any);
        const data = await fetchWithAuth(`/bookings?${params}`);
        return toArray(data, 'bookings');
    },

    async getById(id: string) {
        const data = await fetchWithAuth(`/bookings/${id}`);
        return data?.booking || data;
    },

    async create(bookingData: any) {
        return await fetchWithAuth('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        });
    },

    async updateStatus(id: string, status: string, staffId: string | null = null) {
        return await fetchWithAuth(`/bookings/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status, staff_id: staffId }),
        });
    },

    async update(id: string, bookingData: any) {
        return await fetchWithAuth(`/bookings/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bookingData),
        });
    },

    async getReview(bookingId: string) {
        return await fetchWithAuth(`/bookings/${bookingId}/review`);
    },

    async submitReview(bookingId: string, rating: number, comment: string) {
        return await fetchWithAuth(`/bookings/${bookingId}/review`, {
            method: 'POST',
            body: JSON.stringify({ rating, comment }),
        });
    },

    async updateReview(bookingId: string, rating: number, comment: string) {
        return await fetchWithAuth(`/bookings/${bookingId}/review`, {
            method: 'PUT',
            body: JSON.stringify({ rating, comment }),
        });
    }
};

// Search API
export const searchAPI = {
    async query(q: string) {
        return await fetchWithAuth(`/search?q=${encodeURIComponent(q)}`);
    }
};

// Admin API
export const adminAPI = {
    async getStats() {
        return await fetchWithAuth('/admin/stats');
    },

    async getAllSalons() {
        const data = await fetchWithAuth('/admin/salons');
        return toArray(data, 'salons');
    },

    async approveSalon(salonId: string) {
        return await fetchWithAuth(`/admin/salons/${salonId}/approve`, {
            method: 'PUT',
        });
    },

    async rejectSalon(salonId: string, reason: string) {
        return await fetchWithAuth(`/admin/salons/${salonId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
    },

    async deleteSalon(salonId: string) {
        return await fetchWithAuth(`/admin/salons/${salonId}`, {
            method: 'DELETE',
        });
    },

    async resetSalonPassword(salonId: string, password: string) {
        return await fetchWithAuth(`/admin/salons/${salonId}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ password }),
        });
    },

    async createSalon(data: any) {
        return await fetchWithAuth('/admin/salons', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getAllBookings() {
        const data = await fetchWithAuth('/admin/bookings');
        return toArray(data, 'bookings');
    },

    async getAllUsers() {
        const data = await fetchWithAuth('/admin/users');
        return toArray(data, 'users');
    },

    async deleteUser(userId: string) {
        return await fetchWithAuth(`/admin/users/${userId}`, {
            method: 'DELETE',
        });
    },

    async getReports(range: string = '30') {
        const data = await fetchWithAuth(`/admin/reports?range=${range}`);
        return data?.reports || {};
    },

    async getAllPayments() {
        const data = await fetchWithAuth('/admin/payments');
        return toArray(data, 'payments');
    },

    async getSettings() {
        return await fetchWithAuth('/admin/settings');
    },

    async updateSettings(settings: any) {
        return await fetchWithAuth('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
    },

    async getSubscriptionPlans() {
        const data = await fetchWithAuth('/admin/subscriptions/plans');
        return data?.plans || data || [];
    },

    async createSubscriptionPlan(planData: any) {
        return await fetchWithAuth('/admin/subscriptions/plans', {
            method: 'POST',
            body: JSON.stringify(planData),
        });
    },

    async updateSubscriptionPlan(id: string, planData: any) {
        return await fetchWithAuth(`/admin/subscriptions/plans/${id}`, {
            method: 'PUT',
            body: JSON.stringify(planData),
        });
    },

    async getSubscriptionAddons() {
        const data = await fetchWithAuth('/admin/subscriptions/addons');
        return data?.addons || data || [];
    },

    async createSubscriptionAddon(addonData: any) {
        return await fetchWithAuth('/admin/subscriptions/addons', {
            method: 'POST',
            body: JSON.stringify(addonData),
        });
    },

    async updateSubscriptionAddon(id: string, addonData: any) {
        return await fetchWithAuth(`/admin/subscriptions/addons/${id}`, {
            method: 'PUT',
            body: JSON.stringify(addonData),
        });
    },

    async getContactEnquiries() {
        const data = await fetchWithAuth('/admin/contact-enquiries');
        return toArray(data, 'enquiries');
    },

    async updateContactEnquiryStatus(id: string, status: string) {
        return await fetchWithAuth(`/admin/contact-enquiries/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    async deleteContactEnquiry(id: string) {
        return await fetchWithAuth(`/admin/contact-enquiries/${id}`, {
            method: 'DELETE',
        });
    },

    async getMemberships() {
        const data = await fetchWithAuth('/admin/memberships');
        return toArray(data, 'memberships');
    },

    async assignMembership(data: { salon_id: string; plan_id: string; status: string }) {
        return await fetchWithAuth('/admin/memberships/assign', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getSalonAddons() {
        const data = await fetchWithAuth('/admin/salons/addons');
        return data?.salonAddons || [];
    },

    async assignSalonAddon(data: { salon_id: string; addon_id: string; action: 'assign' | 'revoke' }) {
        return await fetchWithAuth('/admin/salons/addons/assign', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async updateOrderStatus(id: string, status: string) {
        return await fetchWithAuth(`/admin/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    async getOrders() {
        const data = await fetchWithAuth('/admin/orders');
        return toArray(data, 'orders');
    },

    async getAllReviews() {
        const data = await fetchWithAuth('/admin/reviews');
        return toArray(data, 'reviews');
    },

    async deleteReview(id: string) {
        return await fetchWithAuth(`/admin/reviews/${id}`, {
            method: 'DELETE',
        });
    },
};

// User Roles API
export const userRolesAPI = {
    async getByUser(userId: string) {
        const data = await fetchWithAuth(`/users/roles?user_id=${userId}`);
        return toArray(data, 'roles');
    },

    async getBySalon(salonId: string) {
        const data = await fetchWithAuth(`/users/roles?salon_id=${salonId}`);
        return toArray(data, 'roles');
    },
};

// Subscriptions API
export const subscriptionsAPI = {
    async getPlans() {
        const data = await fetchWithAuth('/subscriptions/plans');
        return data?.plans || data || [];
    },

    async getMySalonSubscriptions(salonId: string) {
        const data = await fetchWithAuth(`/subscriptions/my?salon_id=${salonId}`);
        return data?.subscriptions || data || [];
    },

    async getAddons() {
        const data = await fetchWithAuth('/subscriptions/addons');
        return data?.addons || data || [];
    },
};

// Profiles API
export const profilesAPI = {
    async getMe() {
        const data = await fetchWithAuth('/users/me');
        return data?.user || data?.profile || data;
    },

    async updateMe(profileData: any) {
        const data = await fetchWithAuth('/users/me', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
        return data?.user || data;
    },

    async getById(userId: string) {
        const data = await fetchWithAuth(`/profiles/${userId}`);
        return data?.profile || data?.user || data;
    },
};

// Staff Profiles API
export const staffProfilesAPI = {
    async getBySalon(salonId: string) {
        const data = await fetchWithAuth(`/staff?salon_id=${salonId}`);
        return toArray(data, 'staff');
    },

    async getById(id: string) {
        const data = await fetchWithAuth(`/staff/${id}`);
        return data?.staff || data;
    },

    async create(staffData: any) {
        return await fetchWithAuth('/staff', {
            method: 'POST',
            body: JSON.stringify(staffData),
        });
    },

    async update(id: string, staffData: any) {
        return await fetchWithAuth(`/staff/${id}`, {
            method: 'PUT',
            body: JSON.stringify(staffData),
        });
    },

    async getProfileStats(id: string, month?: number, year?: number) {
        let url = `/staff/${id}/profile-stats`;
        const params = new URLSearchParams();
        if (month) params.append('month', month.toString());
        if (year) params.append('year', year.toString());
        if (params.toString()) url += `?${params.toString()}`;
        return await fetchWithAuth(url);
    },

    async getLeaves(id: string) {
        const data = await fetchWithAuth(`/staff/${id}/leaves`);
        return toArray(data, 'leaves');
    },

    async createLeave(id: string, leaveData: any) {
        return await fetchWithAuth(`/staff/${id}/leaves`, {
            method: 'POST',
            body: JSON.stringify(leaveData),
        });
    },

    async checkIn(salonId: string) {
        return await fetchWithAuth('/staff/attendance/check-in', {
            method: 'POST',
            body: JSON.stringify({ salon_id: salonId }),
        });
    },

    async checkOut(salonId: string) {
        return await fetchWithAuth('/staff/attendance/check-out', {
            method: 'POST',
            body: JSON.stringify({ salon_id: salonId }),
        });
    },

    async getAttendance(staffId: string) {
        const data = await fetchWithAuth(`/staff/attendance/${staffId}`);
        return toArray(data, 'attendance');
    },

    async getMe(salonId: string) {
        const data = await fetchWithAuth(`/staff/me?salon_id=${salonId}`);
        return data?.staff || data;
    },

    async syncServices(id: string, serviceIds: string[]) {
        return await fetchWithAuth(`/staff/${id}/services`, {
            method: 'POST',
            body: JSON.stringify({ service_ids: serviceIds }),
        });
    },

    async getAvailableSpecialists(params: { salon_id: string; service_id?: string; date?: string; time?: string }) {
        const query = new URLSearchParams(params as any);
        const data = await fetchWithAuth(`/staff/available-specialists?${query}`);
        return toArray(data, 'specialists');
    },

    async delete(id: string) {
        await fetchWithAuth(`/staff/${id}`, { method: 'DELETE' });
    },
};

// Notifications API
export const notificationsAPI = {
    async getAll(filters?: { salon_id?: string; unread_only?: string }) {
        const params = new URLSearchParams(filters as any);
        const data = await fetchWithAuth(`/notifications?${params}`);
        return toArray(data, 'notifications');
    },

    async markAsRead(id: string) {
        return await fetchWithAuth(`/notifications/${id}/read`, {
            method: 'PUT',
        });
    },

    async markAllAsRead(salonId?: string) {
        const url = `/notifications/read-all${salonId ? `?salon_id=${salonId}` : ''}`;
        return await fetchWithAuth(url, {
            method: 'PUT',
        });
    },

    async delete(id: string) {
        return await fetchWithAuth(`/notifications/${id}`, {
            method: 'DELETE',
        });
    },
};

// Uploads API
export const uploadAPI = {
    async upload(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return await fetchWithFileUpload('/uploads', formData);
    },
};

// Orders API
export const ordersAPI = {
    async create(orderData: any) {
        return await fetchWithAuth('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    },

    async getMyOrders() {
        const data = await fetchWithAuth('/orders/my');
        return toArray(data, 'orders');
    }
};

// Export all APIs
export const api = {
    auth: authAPI,
    salons: salonsAPI,
    services: servicesAPI,
    bookings: bookingsAPI,
    staff: staffProfilesAPI,
    userRoles: userRolesAPI,
    admin: adminAPI,
    orders: ordersAPI,
    subscriptions: subscriptionsAPI,
    profiles: profilesAPI,
    notifications: notificationsAPI,
    uploads: uploadAPI,
    search: searchAPI,
    reviews: {
        getAll: () => fetchWithAuth('/reviews'),
        getByService: (serviceId: string) => fetchWithAuth(`/reviews?service_id=${serviceId}`),
        getBySalon: (salonId: string) => fetchWithAuth(`/reviews?salon_id=${salonId}`),
        create: (data: any) => fetchWithAuth('/reviews', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    },
    customerRecords: {
        getProfile: (userId: string, salonId: string) => fetchWithAuth(`/customer_records/${userId}/salon/${salonId}`),
        saveProfile: (data: any) => fetchWithAuth('/customer_records', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getTreatmentRecord: (bookingId: string) => fetchWithAuth(`/customer_records/treatments/${bookingId}`),
        saveTreatmentRecord: (data: any) => fetchWithAuth('/customer_records/treatments', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getUserTreatments: (userId: string, salonId?: string) => {
            const url = `/customer_records/${userId}/treatments${salonId ? `?salon_id=${salonId}` : ''}`;
            return fetchWithAuth(url);
        },
        getTransformations: () => fetchWithAuth('/customer_records/transformations')
    },
    reminders: {
        create: (data: any) => fetchWithAuth('/reminders', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getAll: (filters?: { salon_id?: string; user_id?: string }) => {
            const params = new URLSearchParams(filters as any);
            return fetchWithAuth(`/reminders?${params}`);
        },
        delete: (id: string) => fetchWithAuth(`/reminders/${id}`, {
            method: 'DELETE',
        }),
    },
    platformProducts: {
        getAll: (audience?: string, category?: string) => {
            let url = '/platform_products';
            const params = new URLSearchParams();
            if (audience) params.append('audience', audience);
            if (category) params.append('category', category);
            if (params.toString()) url += `?${params.toString()}`;
            return fetchWithAuth(url);
        },
        getById: (id: string) => fetchWithAuth(`/platform_products/${id}`),
        create: (data: any) => fetchWithAuth('/platform_products', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: any) => fetchWithAuth(`/platform_products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => fetchWithAuth(`/platform_products/${id}`, {
            method: 'DELETE',
        }),
    },
    offers: {
        getBySalon: async (salonId: string) => {
            const data = await fetchWithAuth(`/offers?salon_id=${salonId}`);
            return toArray(data, 'offers');
        },
        getById: (id: string) => fetchWithAuth(`/offers/${id}`),
        create: (data: any) => fetchWithAuth('/offers', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: any) => fetchWithAuth(`/offers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => fetchWithAuth(`/offers/${id}`, {
            method: 'DELETE',
        }),
    },
    inventory: {
        getBySalon: (salonId: string, category?: string) => {
            let url = `/inventory?salon_id=${salonId}`;
            if (category) url += `&category=${category}`;
            return fetchWithAuth(url);
        },
        getSuppliers: (salonId: string) => fetchWithAuth(`/inventory?salon_id=${salonId}&suppliers_only=1`),
        getById: (id: string, salonId: string) => fetchWithAuth(`/inventory/${id}?salon_id=${salonId}`),
        create: (data: any) => fetchWithAuth('/inventory', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: any) => fetchWithAuth(`/inventory/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id: string, salonId: string, isSupplier: boolean = false) => {
            const url = `/inventory/${id}?salon_id=${salonId}${isSupplier ? '&is_supplier=1' : ''}`;
            return fetchWithAuth(url, { method: 'DELETE' });
        },
    },
    messages: {
        getAll: (salonId?: string) => {
            let url = '/messages';
            if (salonId) url += `?salon_id=${salonId}`;
            return fetchWithAuth(url);
        },
        send: (data: {
            salon_id?: string;
            receiver_id?: string;
            subject?: string;
            content: string;
            recipient_type: 'owner' | 'super_admin' | 'staff'
        }) => fetchWithAuth('/messages', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        markAsRead: (id: string) => fetchWithAuth(`/messages/${id}/read`, {
            method: 'PATCH',
        }),
        delete: (id: string) => fetchWithAuth(`/messages/${id}`, {
            method: 'DELETE',
        }),
    },
    newsletter: {
        subscribe: (email: string) => fetchWithAuth('/newsletter/subscribe', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
    },
    coins: {
        getBalance: () => fetchWithAuth('/coins?action=get-balance'),
        getTransactions: () => fetchWithAuth('/coins?action=get-transactions'),
        adminGetPrice: () => fetchWithAuth('/coins?action=admin-get-price'),
        adminSetPrice: (price: number) => fetchWithAuth('/coins?action=admin-set-price', {
            method: 'POST',
            body: JSON.stringify({ price }),
        }),
        adminAdjust: (userId: string, amount: number, type: string, description: string) => fetchWithAuth('/coins?action=admin-adjust', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, amount, type, description }),
        }),
    },
    contactEnquiries: {
        create: (data: any) => fetchWithAuth('/contact-enquiries', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    },
    knowledgeBase: {
        getBySalon: async (salonId: string, category?: string, serviceId?: string) => {
            let url = `/knowledge-base?salon_id=${salonId}`;
            if (category) url += `&category=${category}`;
            if (serviceId) url += `&service_id=${serviceId}`;
            const data = await fetchWithAuth(url);
            return toArray(data, 'items');
        },
        create: (data: any) => fetchWithAuth('/knowledge-base', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        update: (id: string, data: any) => fetchWithAuth(`/knowledge-base/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
        delete: (id: string) => fetchWithAuth(`/knowledge-base/${id}`, {
            method: 'DELETE',
        }),
    },
    productPurchases: {
        getByCustomer: async (userId: string, salonId: string) => {
            const data = await fetchWithAuth(`/product_purchases?user_id=${userId}&salon_id=${salonId}`);
            return toArray(data, 'purchases');
        },
        create: (data: { user_id: string; salon_id: string; product_name: string; price: number; purchase_date?: string }) =>
            fetchWithAuth('/product_purchases', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    },
    loyalty: {
        getSettings: (salonId: string) => fetchWithAuth(`/loyalty/settings?salon_id=${salonId}`),
        updateSettings: (data: any) => fetchWithAuth('/loyalty/settings', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        getRewards: async (salonId: string, activeOnly: boolean = false) => {
            const data = await fetchWithAuth(`/loyalty/rewards?salon_id=${salonId}${activeOnly ? '&active_only=true' : ''}`);
            return toArray(data, 'rewards');
        },
        createReward: (data: any) => fetchWithAuth('/loyalty/rewards', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
        deleteReward: (salonId: string, rewardId: string) => fetchWithAuth(`/loyalty/rewards/${rewardId}?salon_id=${salonId}`, {
            method: 'DELETE',
        }),
        getMyPoints: async (salonId: string) => {
            const data = await fetchWithAuth(`/loyalty/my-points?salon_id=${salonId}`);
            return data?.points || 0;
        },
        redeem: (salonId: string, rewardId: string) => fetchWithAuth('/loyalty/redeem', {
            method: 'POST',
            body: JSON.stringify({ salon_id: salonId, reward_id: rewardId }),
        }),
    }
};

export default api;

<?php
require_once __DIR__ . '/NotificationService.php';
require_once __DIR__ . '/InvoiceService.php';

class MembershipService
{
    private $db;
    private $notifService;
    private $invoiceService;

    public function __construct($db)
    {
        $this->db = $db;
        $this->notifService = new NotificationService($db);
        $this->invoiceService = new InvoiceService($db, $this->notifService);
    }

    public function getActivePlan($salonId)
    {
        $stmt = $this->db->prepare("
            SELECT ss.*, sp.name as plan_name, sp.max_staff, sp.max_services, sp.features
            FROM salon_subscriptions ss
            JOIN subscription_plans sp ON ss.plan_id = sp.id
            WHERE ss.salon_id = ? AND ss.status = 'active'
            AND (ss.subscription_end_date IS NULL OR ss.subscription_end_date > NOW())
        ");
        $stmt->execute([$salonId]);
        $plan = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$plan) {
            // Fallback: Fetch default "Free Trial" plan limits if no record exists
            $stmtFallback = $this->db->prepare("
                SELECT 'free-trial-fallback' as id, ? as salon_id, id as plan_id, 'trial' as status, 
                       name as plan_name, max_staff, max_services, features
                FROM subscription_plans
                WHERE slug = 'free-trial' OR slug = 'basic'
                LIMIT 1
            ");
            $stmtFallback->execute([$salonId]);
            $plan = $stmtFallback->fetch(PDO::FETCH_ASSOC);
        }

        return $plan;
    }

    public function canAddStaff($salonId)
    {
        // Plan feature removed - always allow
        return true;
    }

    public function canAddService($salonId)
    {
        // Plan feature removed - always allow
        return true;
    }

    private function notifyUpgrade($salonId, $feature)
    {
        $ownerId = $this->invoiceService->getSalonOwnerId($salonId);

        if ($ownerId) {
            $this->notifService->notifyUser(
                $ownerId,
                "Upgrade Required",
                "You have reached your limit for $feature. Please upgrade your plan to add more.",
                'warning',
                '/dashboard/billing'
            );
        }

        // Notify Super Admin
        $stmt = $this->db->prepare("
            SELECT ur.user_id 
            FROM user_roles ur 
            JOIN profiles p ON ur.user_id = p.user_id 
            WHERE p.user_type = 'superadmin' 
            LIMIT 1
        ");
        $stmt->execute();
        $superAdminId = $stmt->fetchColumn();

        if ($superAdminId) {
            $stmt = $this->db->prepare("SELECT name FROM salons WHERE id = ?");
            $stmt->execute([$salonId]);
            $salonName = $stmt->fetchColumn();

            $this->notifService->notifyUser(
                $superAdminId,
                "Upgrade Recommended",
                "Salon '$salonName' has reached their limit for $feature.",
                'info',
                '/admin/members'
            );
        }
    }
}

<?php
// Customer Records routes

// GET /api/customer_records/:userId/salon/:salonId - Get custom profile
if ($method === 'GET' && count($uriParts) === 4 && $uriParts[2] === 'salon') {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $userId = $uriParts[1];
    $salonId = $uriParts[3];

    // Check permission (user themselves or salon staff)
    $hasAccess = ($userData['user_id'] === $userId);
    if (!$hasAccess) {
        $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ?");
        $stmt->execute([$userData['user_id'], $salonId]);
        $hasAccess = (bool)$stmt->fetch();
    }

    if (!$hasAccess) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare("SELECT * FROM customer_salon_profiles WHERE user_id = ? AND salon_id = ?");
    $stmt->execute([$userId, $salonId]);
    $profile = $stmt->fetch();

    sendResponse(['profile' => $profile]);
}

// POST /api/customer_records - Create or update profile
if ($method === 'POST' && count($uriParts) === 1) {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $data = getRequestBody();
    $userId = $data['user_id'] ?? null;
    $salonId = $data['salon_id'] ?? null;

    if (!$userId || !$salonId) {
        sendResponse(['error' => 'User ID and Salon ID are required'], 400);
    }

    // Check permission (only salon staff can update health records)
    $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ?");
    $stmt->execute([$userData['user_id'], $salonId]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare("
        INSERT INTO customer_salon_profiles (id, user_id, salon_id, date_of_birth, skin_type, skin_issues, allergy_records)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            date_of_birth = VALUES(date_of_birth),
            skin_type = VALUES(skin_type),
            skin_issues = VALUES(skin_issues),
            allergy_records = VALUES(allergy_records)
    ");

    $stmt->execute([
        Auth::generateUuid(),
        $userId,
        $salonId,
        $data['date_of_birth'] ?? null,
        $data['skin_type'] ?? null,
        $data['skin_issues'] ?? null,
        $data['allergy_records'] ?? null
    ]);

    sendResponse(['success' => true]);
}

// Routes for treatment records
// GET /api/customer_records/treatments/:bookingId - Get treatment record
if ($method === 'GET' && count($uriParts) === 3 && $uriParts[1] === 'treatments') {
    $bookingId = $uriParts[2];
    $stmt = $db->prepare("SELECT * FROM treatment_records WHERE booking_id = ?");
    $stmt->execute([$bookingId]);
    $record = $stmt->fetch();
    sendResponse(['record' => $record]);
}

// POST /api/customer_records/treatments - Create or update treatment record
if ($method === 'POST' && count($uriParts) === 2 && $uriParts[1] === 'treatments') {
    $userData = Auth::getUserFromToken();
    if (!$userData) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $data = getRequestBody();
    $bookingId = $data['booking_id'] ?? null;
    $salonId = $data['salon_id'] ?? null;
    $userId = $data['user_id'] ?? null;

    if (!$bookingId && (!$salonId || !$userId)) {
        sendResponse(['error' => 'Booking ID or (Salon ID and User ID) are required'], 400);
    }

    if ($bookingId) {
        // Fetch booking to get salon_id and user_id if not provided
        $stmt = $db->prepare("SELECT salon_id, user_id FROM bookings WHERE id = ?");
        $stmt->execute([$bookingId]);
        $booking = $stmt->fetch();

        if (!$booking) {
            sendResponse(['error' => 'Booking not found'], 404);
        }
        $salonId = $booking['salon_id'];
        $userId = $booking['user_id'];
    }

    // Check permission
    $stmt = $db->prepare("SELECT id FROM user_roles WHERE user_id = ? AND salon_id = ?");
    $stmt->execute([$userData['user_id'], $salonId]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare("
        INSERT INTO treatment_records (
            id, booking_id, user_id, salon_id, service_name_manual, record_date, treatment_details, products_used, 
            skin_reaction, improvement_notes, recommended_next_treatment, 
            post_treatment_instructions, follow_up_reminder_date, marketing_notes,
            before_photo_url, before_photo_public_id, after_photo_url, after_photo_public_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            service_name_manual = VALUES(service_name_manual),
            record_date = VALUES(record_date),
            treatment_details = VALUES(treatment_details),
            products_used = VALUES(products_used),
            skin_reaction = VALUES(skin_reaction),
            improvement_notes = VALUES(improvement_notes),
            recommended_next_treatment = VALUES(recommended_next_treatment),
            post_treatment_instructions = VALUES(post_treatment_instructions),
            follow_up_reminder_date = VALUES(follow_up_reminder_date),
            marketing_notes = VALUES(marketing_notes),
            before_photo_url = VALUES(before_photo_url),
            before_photo_public_id = VALUES(before_photo_public_id),
            after_photo_url = VALUES(after_photo_url),
            after_photo_public_id = VALUES(after_photo_public_id)
    ");

    $stmt->execute([
        Auth::generateUuid(),
        $bookingId,
        $userId,
        $salonId,
        $data['service_name_manual'] ?? null,
        $data['record_date'] ?? null,
        $data['treatment_details'] ?? null,
        $data['products_used'] ?? null,
        $data['skin_reaction'] ?? null,
        $data['improvement_notes'] ?? null,
        $data['recommended_next_treatment'] ?? null,
        $data['post_treatment_instructions'] ?? null,
        $data['follow_up_reminder_date'] ?? null,
        $data['marketing_notes'] ?? null,
        $data['before_photo_url'] ?? null,
        $data['before_photo_public_id'] ?? null,
        $data['after_photo_url'] ?? null,
        $data['after_photo_public_id'] ?? null
    ]);

    sendResponse(['success' => true]);
}

// GET /api/customer_records/:userId/treatments - Get all treatments for a user
if ($method === 'GET' && count($uriParts) === 3 && $uriParts[2] === 'treatments') {
    $userId = $uriParts[1];
    $salonId = $_GET['salon_id'] ?? null;

    $query = "SELECT tr.*, s.name as service_name, b.booking_date 
              FROM treatment_records tr
              LEFT JOIN bookings b ON tr.booking_id = b.id
              LEFT JOIN services s ON b.service_id = s.id
              WHERE tr.user_id = ?";
    $params = [$userId];

    if ($salonId) {
        $query .= " AND tr.salon_id = ?";
        $params[] = $salonId;
    }

    $query .= " ORDER BY COALESCE(b.booking_date, tr.record_date, tr.created_at) DESC";

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $treatments = $stmt->fetchAll();

    sendResponse(['treatments' => $treatments]);
}

// GET /api/customer_records/transformations - Get all public transformations
if ($method === 'GET' && count($uriParts) === 2 && $uriParts[1] === 'transformations') {
    try {
        $stmt = $db->prepare("
            SELECT 
                tr.id, 
                tr.before_photo_url as before_image, 
                tr.after_photo_url as after_image,
                tr.treatment_details as comment,
                COALESCE(p.full_name, SUBSTRING_INDEX(u.email, '@', 1)) as customer_name,
                s.name as treatment_name,
                CONCAT(s.duration_minutes, ' Minutes') as duration,
                COALESCE(r.rating, 5) as rating
            FROM treatment_records tr
            JOIN users u ON tr.user_id = u.id
            LEFT JOIN profiles p ON tr.user_id = p.user_id
            JOIN bookings b ON tr.booking_id = b.id
            JOIN services s ON b.service_id = s.id
            LEFT JOIN booking_reviews r ON tr.booking_id = r.booking_id
            WHERE tr.before_photo_url IS NOT NULL AND tr.after_photo_url IS NOT NULL
            ORDER BY tr.created_at DESC
        ");
        $stmt->execute();
        $transformations = $stmt->fetchAll();
        sendResponse(['transformations' => $transformations]);
    }
    catch (Exception $e) {
        sendResponse(['error' => 'Failed to fetch transformations: ' . $e->getMessage()], 500);
    }
}

sendResponse(['error' => 'Customer records route not found'], 404);

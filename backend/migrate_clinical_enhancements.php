<?php
// Migration script to update treatment_records table
$host = 'localhost';
$db = 'salon_booking';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    echo "Starting migration...\n";

    // 1. Drop the unique constraint on booking_id if it exists
    // In MySQL, we need to know the index name. Usually it's same as column or 'booking_id'
    try {
        $pdo->exec("ALTER TABLE treatment_records DROP INDEX booking_id");
        echo "Dropped unique index on booking_id.\n";
    }
    catch (Exception $e) {
        echo "Warning: Could not drop index (it might not exist as a separate unique index): " . $e->getMessage() . "\n";
    }

    // 2. Modify booking_id to be nullable
    $pdo->exec("ALTER TABLE treatment_records MODIFY booking_id VARCHAR(36) NULL");
    echo "Modified booking_id to be nullable.\n";

    // 3. Add service_name_manual column
    $pdo->exec("ALTER TABLE treatment_records ADD COLUMN service_name_manual VARCHAR(255) NULL AFTER salon_id");
    echo "Added service_name_manual column.\n";

    // 4. Add record_date column (for non-booking records)
    $pdo->exec("ALTER TABLE treatment_records ADD COLUMN record_date DATE NULL AFTER service_name_manual");
    echo "Added record_date column.\n";

    echo "Migration completed successfully!\n";

}
catch (\PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}

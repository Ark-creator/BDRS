<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB; // <-- Make sure to import DB
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the 'role' column to add 'super_admin'
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('resident', 'admin', 'super_admin') NOT NULL DEFAULT 'resident'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert the 'role' column back to its original state
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('resident', 'admin') NOT NULL DEFAULT 'resident'");
    }
};
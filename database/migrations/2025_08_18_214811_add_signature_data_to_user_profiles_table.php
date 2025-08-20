<?php

// 1. MIGRATION FILE
// Filename: yyyy_mm_dd_hhmmss_add_signature_data_to_user_profiles_table.php
// Run `php artisan make:migration add_signature_data_to_user_profiles_table --table=user_profiles` to create this file.
// Then, copy the content below into the generated file.

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            // Add the new column for the signature.
            // We use longText because a Base64 image string can be very long.
            // It's nullable() in case existing users don't have a signature yet.
            $table->longText('signature_data')->nullable()->after('face_image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            // This allows you to undo the migration if needed.
            $table->dropColumn('signature_data');
        });
    }
};
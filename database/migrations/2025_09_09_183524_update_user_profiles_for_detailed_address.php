<?php

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
            // Add the new columns for suffix and the structured address
            $table->string('suffix', 20)->nullable()->after('last_name');
            $table->string('province')->after('phone_number');
            $table->string('city')->after('province');
            $table->string('barangay')->after('city');
            $table->string('street_address')->after('barangay');

            // Remove the old, generic 'address' column
            $table->dropColumn('address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            // This allows you to safely reverse the migration if needed
            $table->dropColumn([
                'suffix',
                'province',
                'city',
                'barangay',
                'street_address'
            ]);
            $table->string('address')->nullable();
        });
    }
};
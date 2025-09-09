<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
  // xxxx_xx_xx_xxxxxx_add_barangay_id_to_users_table.php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        // Add the foreign key after the 'id' column
        $table->foreignId('barangay_id')->nullable()->constrained('barangays')->after('id');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            //
        });
    }
};

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
        Schema::table('replies', function (Blueprint $table) {
            // Ito ay magdaragdag ng 'status' column na may default value na 'unread'
            $table->string('status')->default('unread')->after('message');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('replies', function (Blueprint $table) {
            // Ang 'down' method ay dapat kabaligtaran ng 'up' method
            $table->dropColumn('status');
        });
    }
};
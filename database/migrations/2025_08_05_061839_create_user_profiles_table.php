<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            // --- Core Fields ---
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Links to the 'users' table.

            // === Personal Information ===
            $table->string('first_name');
            $table->string('middle_name')->nullable(); // As requested, nullable for flexibility.
            $table->string('last_name');
            
            // === Contact Information ===
            $table->string('phone_number')->unique()->nullable(); // Unique to prevent duplicates, nullable if not required.
            $table->text('address')->nullable(); // For longer address details.

            // === Demographic Information ===
            $table->date('birthday')->nullable(); // Stores only the date (YYYY-MM-DD).
            $table->string('gender')->nullable(); // e.g., 'Male', 'Female', 'Other'.
            $table->string('civil_status')->nullable(); // As requested: e.g., 'Single', 'Married', 'Widowed'.

            // === Other Profile Data ===
            $table->string('profile_picture_url')->nullable(); // To store the path or URL to an image.

            // --- Timestamps ---
            $table->timestamps(); // Adds created_at and updated_at columns.
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('user_profiles');
    }
};
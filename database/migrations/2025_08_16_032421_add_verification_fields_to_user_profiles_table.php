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
            $table->string('valid_id_type')->nullable();
            $table->string('valid_id_front_path')->nullable();
            $table->string('valid_id_back_path')->nullable();
            $table->string('face_image_path')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_profiles', function (Blueprint $table) {
            $table->dropColumn(['valid_id_type', 'valid_id_front_path', 'valid_id_back_path', 'face_image_path']);
        });
    }
};

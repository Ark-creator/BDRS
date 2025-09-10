<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // Import DB facade

return new class extends Migration
{
    public function up(): void
    {
        // Table name is now 'welcome_content'
        Schema::create('welcome_content', function (Blueprint $table) {
            $table->id();
            $table->string('footer_logo_url')->nullable();
            $table->string('footer_title')->nullable();
            $table->string('footer_subtitle')->nullable();
            $table->text('footer_address')->nullable();
            $table->string('footer_email')->nullable();
            $table->string('footer_phone')->nullable();
            $table->timestamps();
            
        });

        // Seed the table with default data
        DB::table('welcome_content')->insert([
            'footer_title' => 'Brgy. San Lorenzo',
            'footer_subtitle' => 'Gapan City, Nueva Ecija',
            'footer_address' => 'Brgy. Hall, San Lorenzo, Gapan City, 3105',
            'footer_email' => 'contact@sanlorenzo.gov.ph',
            'footer_phone' => '(044) 329-6240',
            'footer_logo_url' => '/images/gapanlogo.png',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('welcome_content');
    }
};
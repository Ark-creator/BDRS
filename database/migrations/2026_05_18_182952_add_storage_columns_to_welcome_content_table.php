<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('welcome_content', function (Blueprint $table) {
            $table->string('footer_logo_path')->nullable()->after('footer_logo_url');
            $table->json('officials')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('welcome_content', function (Blueprint $table) {
            $table->dropColumn('footer_logo_path');
        });
    }
};
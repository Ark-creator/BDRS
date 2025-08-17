<?php

// database/migrations/YYYY_MM_DD_XXXXXX_create_announcements_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('tag');
            $table->string('title');
            $table->text('description');
            $table->string('image'); // This will store the path to the image
            $table->string('link')->nullable(); // The link for "Read More"

            // This links the announcement to the user who created it
            // I'm assuming you have a standard `users` table.
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_immutable_documents_archive_history_table.php

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
        Schema::create('immutable_documents_archive_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('original_request_id'); // <-- ADD THIS LINE
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('document_type_id')->constrained('document_types')->onDelete('cascade');
            $table->json('form_data');
            $table->string('status'); // 'Claimed' or 'Rejected'
            $table->text('admin_remarks')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('original_created_at'); // Para malaman kung kailan ginawa ang original request
            $table->timestamps(); // Ito ay para malaman kung kailan na-archive
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('immutable_documents_archive_history');
    }
};
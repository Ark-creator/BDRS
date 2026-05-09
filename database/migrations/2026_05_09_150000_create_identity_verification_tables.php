<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verifications', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('document_type')->index();
            $table->string('status')->default('draft')->index();
            $table->string('id_image_path')->nullable();
            $table->string('selfie_image_path')->nullable();
            $table->string('id_image_hash', 128)->nullable()->index();
            $table->string('selfie_image_hash', 128)->nullable()->index();
            $table->json('extracted_data')->nullable();
            $table->json('document_validation')->nullable();
            $table->json('scores')->nullable();
            $table->decimal('face_match_score', 5, 2)->nullable();
            $table->decimal('ocr_confidence', 5, 2)->nullable();
            $table->decimal('fake_probability', 5, 2)->nullable();
            $table->decimal('liveness_score', 5, 2)->nullable();
            $table->decimal('overall_score', 5, 2)->nullable()->index();
            $table->date('id_expires_at')->nullable()->index();
            $table->text('failure_reason')->nullable();
            $table->timestamp('submitted_at')->nullable()->index();
            $table->timestamp('processed_at')->nullable()->index();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_notes')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['document_type', 'status']);
        });

        Schema::create('verification_faces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verification_id')->constrained('verifications')->cascadeOnDelete();
            $table->string('source')->index();
            $table->unsignedInteger('face_count')->default(0);
            $table->decimal('quality_score', 5, 2)->nullable();
            $table->string('embedding_hash', 128)->nullable()->index();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['verification_id', 'source']);
        });

        Schema::create('verification_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verification_id')->constrained('verifications')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event')->index();
            $table->string('level')->default('info')->index();
            $table->text('message');
            $table->json('context')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['verification_id', 'created_at']);
        });

        Schema::create('fraud_alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('verification_id')->constrained('verifications')->cascadeOnDelete();
            $table->string('type')->index();
            $table->string('severity')->default('medium')->index();
            $table->string('status')->default('open')->index();
            $table->text('message');
            $table->json('metadata')->nullable();
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['verification_id', 'status']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->nullableMorphs('auditable');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action')->index();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['action', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('fraud_alerts');
        Schema::dropIfExists('verification_logs');
        Schema::dropIfExists('verification_faces');
        Schema::dropIfExists('verifications');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index('barangay_id', 'users_barangay_id_index');
            $table->index('role', 'users_role_index');
            $table->index('status', 'users_status_index');
            $table->index('verification_status', 'users_verification_status_index');
        });

        Schema::table('user_profiles', function (Blueprint $table) {
            $table->index('user_id', 'user_profiles_user_id_index');
        });

        Schema::table('document_types', function (Blueprint $table) {
            $table->index('barangay_id', 'document_types_barangay_id_index');
            $table->index('is_archived', 'document_types_is_archived_index');
            $table->index('archived_by', 'document_types_archived_by_index');
        });

        Schema::table('document_requests', function (Blueprint $table) {
            $table->index('barangay_id', 'document_requests_barangay_id_index');
            $table->index('user_id', 'document_requests_user_id_index');
            $table->index('document_type_id', 'document_requests_document_type_id_index');
            $table->index('processed_by', 'document_requests_processed_by_index');
            $table->index('status', 'document_requests_status_index');
            $table->index('payment_status', 'document_requests_payment_status_index');
            $table->index('created_at', 'document_requests_created_at_index');
            $table->index(['status', 'user_id'], 'document_requests_status_user_id_index');
            $table->index(['barangay_id', 'status'], 'document_requests_barangay_id_status_index');
        });

        Schema::table('uploaded_credentials', function (Blueprint $table) {
            $table->index('document_request_id', 'uploaded_credentials_document_request_id_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('document_request_id', 'payments_document_request_id_index');
            $table->index('status', 'payments_status_index');
            $table->index('reference_number', 'payments_reference_number_index');
        });

        Schema::table('contact_messages', function (Blueprint $table) {
            $table->index('barangay_id', 'contact_messages_barangay_id_index');
            $table->index('user_id', 'contact_messages_user_id_index');
            $table->index('status', 'contact_messages_status_index');
        });

        Schema::table('replies', function (Blueprint $table) {
            $table->index('contact_message_id', 'replies_contact_message_id_index');
            $table->index('user_id', 'replies_user_id_index');
            $table->index(['contact_message_id', 'status'], 'replies_contact_message_id_status_index');
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->index('barangay_id', 'announcements_barangay_id_index');
            $table->index('user_id', 'announcements_user_id_index');
            $table->index('created_at', 'announcements_created_at_index');
        });

        Schema::table('barangays', function (Blueprint $table) {
            $table->index('municipality_id', 'barangays_municipality_id_index');
        });

        Schema::table('immutable_documents_archive_history', function (Blueprint $table) {
            $table->index('barangay_id', 'idah_barangay_id_index');
            $table->index('user_id', 'idah_user_id_index');
            $table->index('document_type_id', 'idah_document_type_id_index');
            $table->index('processed_by', 'idah_processed_by_index');
            $table->index('original_request_id', 'idah_original_request_id_index');
            $table->index('status', 'idah_status_index');
            $table->index('created_at', 'idah_created_at_index');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->index('read_at', 'notifications_read_at_index');
        });

        Schema::table('cache', function (Blueprint $table) {
            $table->index('expiration', 'cache_expiration_index');
        });

        Schema::table('cache_locks', function (Blueprint $table) {
            $table->index('expiration', 'cache_locks_expiration_index');
        });

        Schema::table('jobs', function (Blueprint $table) {
            $table->index(['queue', 'reserved_at', 'available_at'], 'jobs_queue_reserved_available_index');
        });

        Schema::table('failed_jobs', function (Blueprint $table) {
            $table->index('failed_at', 'failed_jobs_failed_at_index');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('user_id', 'audit_logs_user_id_index');
            $table->index('created_at', 'audit_logs_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_index');
            $table->dropIndex('users_status_index');
            $table->dropIndex('users_verification_status_index');
        });

        Schema::table('document_types', function (Blueprint $table) {
            $table->dropIndex('document_types_is_archived_index');
        });

        Schema::table('document_requests', function (Blueprint $table) {
            $table->dropIndex('document_requests_status_index');
            $table->dropIndex('document_requests_payment_status_index');
            $table->dropIndex('document_requests_created_at_index');
            $table->dropIndex('document_requests_status_user_id_index');
            $table->dropIndex('document_requests_barangay_id_status_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_status_index');
            $table->dropIndex('payments_reference_number_index');
        });

        Schema::table('contact_messages', fn ($t) => $t->dropIndex('contact_messages_status_index'));

        Schema::table('replies', fn ($t) => $t->dropIndex('replies_contact_message_id_status_index'));

        Schema::table('announcements', fn ($t) => $t->dropIndex('announcements_created_at_index'));

        Schema::table('immutable_documents_archive_history', function (Blueprint $table) {
            $table->dropIndex('idah_status_index');
            $table->dropIndex('idah_created_at_index');
            $table->dropIndex('idah_original_request_id_index');
        });

        Schema::table('notifications', fn ($t) => $t->dropIndex('notifications_read_at_index'));
        Schema::table('cache', fn ($t) => $t->dropIndex('cache_expiration_index'));
        Schema::table('cache_locks', fn ($t) => $t->dropIndex('cache_locks_expiration_index'));
        Schema::table('jobs', fn ($t) => $t->dropIndex('jobs_queue_reserved_available_index'));
        Schema::table('failed_jobs', fn ($t) => $t->dropIndex('failed_jobs_failed_at_index'));
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('audit_logs_user_id_index');
            $table->dropIndex('audit_logs_created_at_index');
        });
    }
};

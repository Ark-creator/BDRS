<?php

// database/migrations/xxxx_xx_xx_xxxxxx_add_claim_voucher_code_to_document_requests_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_requests', function (Blueprint $table) {
            // Add the new column after 'status' for better organization
            $table->string('claim_voucher_code')->unique()->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('document_requests', function (Blueprint $table) {
            $table->dropColumn('claim_voucher_code');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    // in the new migration file
public function up(): void
{
    Schema::table('document_requests', function (Blueprint $table) {
        $table->decimal('payment_amount', 8, 2)->nullable()->after('form_data');
        $table->string('payment_status')->default('unpaid')->after('payment_amount'); // unpaid, paid, verified
        $table->string('payment_receipt_path')->nullable()->after('payment_status');
        $table->timestamp('paid_at')->nullable()->after('payment_receipt_path');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_requests', function (Blueprint $table) {
            //
        });
    }
};

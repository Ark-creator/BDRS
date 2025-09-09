<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   // xxxx_xx_xx_xxxxxx_create_barangays_table.php
public function up(): void
    {
        Schema::create('barangays', function (Blueprint $table) {
            $table->id();
            // Link it to the municipalities table
            $table->foreignId('municipality_id')->constrained('municipalities');
            $table->string('name');
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barangays');
    }
};

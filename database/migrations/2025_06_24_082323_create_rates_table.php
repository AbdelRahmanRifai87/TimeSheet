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
        Schema::create('rates', function (Blueprint $table) {
            $table->id();
            // Foreign keys
            $table->foreignId('shift_type_id')->constrained('shift_types')->onDelete('cascade');
            $table->foreignId('day_type_id')->constrained('day_types')->onDelete('cascade');

            // Rate
            $table->decimal('rate', 8, 2); //rate can have decimals (e.g. 12.50)

            // Add a unique constraint to prevent duplicate (shift_type_id, day_type_id) combinations
            $table->unique(['shift_type_id', 'day_type_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rates');
    }
};

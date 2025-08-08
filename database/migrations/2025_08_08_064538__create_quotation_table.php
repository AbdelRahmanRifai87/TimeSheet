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
        Schema::table('quotations', function (Blueprint $table) {
            // Add missing columns if they don't exist
            if (!Schema::hasColumn('quotations', 'name')) {
                $table->string('name');
            }
            if (!Schema::hasColumn('quotations', 'client_name')) {
                $table->string('client_name')->nullable();
            }
            if (!Schema::hasColumn('quotations', 'description')) {
                $table->text('description')->nullable();
            }
            if (!Schema::hasColumn('quotations', 'status')) {
                $table->enum('status', ['draft', 'finalized'])->default('draft');
            }
            if (!Schema::hasColumn('quotations', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable();
                // Add foreign key constraint
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotations', function (Blueprint $table) {
            // Drop the columns in reverse order
            $table->dropForeign(['created_by']);
            $table->dropColumn(['name', 'client_name', 'description', 'status', 'created_by']);
        });
    }
};

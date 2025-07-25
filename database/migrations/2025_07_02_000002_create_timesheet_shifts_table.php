<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timesheet_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('timesheet_id')->constrained('exported_time_sheets')->onDelete('cascade');
            $table->foreignId('shift_type_id')->constrained('shift_types')->onDelete('cascade');
            $table->date('date');
            $table->time('from');
            $table->time('to');
            $table->unsignedInteger('employees');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timesheet_shifts');
    }
};

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ShiftType;

class ShiftTypeSeeder extends Seeder
{
    public function run(): void
    {
        // Create a single shift type
        ShiftType::truncate();
        ShiftType::create([
            'name' => 'General Shift',
            'description' => 'A general shift type for all day types.'
        ]);
    }
}

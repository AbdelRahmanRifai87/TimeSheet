<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Rate;
use App\Models\ShiftType;
use App\Models\DayType;

class RateSeeder extends Seeder
{
    public function run(): void
    {
        Rate::truncate();
        $shiftType = ShiftType::first();
        $dayTypes = DayType::all();
        foreach ($dayTypes as $dayType) {
            Rate::create([
                'shift_type_id' => $shiftType->id,
                'day_type_id' => $dayType->id,
                'rate' => 100, // Example rate, adjust as needed
            ]);
        }
    }
}

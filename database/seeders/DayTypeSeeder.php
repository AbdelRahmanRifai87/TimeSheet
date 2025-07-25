<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DayType;

class DayTypeSeeder extends Seeder
{
    public function run(): void
    {
        DayType::truncate();
        $types = [
            ['name' => 'day'],
            ['name' => 'night'],
            ['name' => 'saturday'],
            ['name' => 'sunday'],
            ['name' => 'public holiday'],
        ];
        foreach ($types as $type) {
            DayType::create($type);
        }
    }
}

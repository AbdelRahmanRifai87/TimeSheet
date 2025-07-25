<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PublicHoliday;

class PublicHolidaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing holidays
        PublicHoliday::truncate();

        // Example holidays (adjust for your country/region)
        $holidays = [
            // 2024
            ['name' => "New Year's Day", 'date' => '2024-01-01'],
            ['name' => "Epiphany / Armenian Christmas", 'date' => '2024-01-06'],
            ['name' => "St Maroun’s Day", 'date' => '2024-02-09'],
            ['name' => "Rafic Hariri Memorial Day", 'date' => '2024-02-14'],
            ['name' => "Feast of the Annunciation", 'date' => '2024-03-25'],
            ['name' => "Good Friday (Western)", 'date' => '2024-03-29'],
            ['name' => "Easter Sunday", 'date' => '2024-03-31'],
            ['name' => "Eid al-Fitr", 'date' => '2024-04-10'],
            ['name' => "Labour Day", 'date' => '2024-05-01'],
            ['name' => "Orthodox Good Friday", 'date' => '2024-05-03'],
            ['name' => "Martyrs’ Day & Orthodox Easter Sunday", 'date' => '2024-05-05'],
            ['name' => "Liberation & Resistance Day", 'date' => '2024-05-12'],
            ['name' => "Eid al-Adha", 'date' => '2024-06-16'],
            ['name' => "Islamic New Year (Muharram)", 'date' => '2024-07-07'],
            ['name' => "Ashura", 'date' => '2024-07-16'],
            ['name' => "Assumption of Mary", 'date' => '2024-08-15'],
            ['name' => "The Prophet’s Birthday", 'date' => '2024-09-15'],
            ['name' => "All Saints’ Day", 'date' => '2024-11-01'],
            ['name' => "Independence Day", 'date' => '2024-11-22'],
            ['name' => "Christmas Day", 'date' => '2024-12-25'],

            // 2025
            ['name' => "New Year's Day", 'date' => '2025-01-01'],
            ['name' => "Epiphany / Armenian Christmas", 'date' => '2025-01-06'],
            ['name' => "St Maroun’s Day", 'date' => '2025-02-09'],
            ['name' => "Feast of the Annunciation", 'date' => '2025-03-25'],
            ['name' => "Eid al-Fitr", 'date' => '2025-03-30'],
            ['name' => "Good Friday", 'date' => '2025-04-18'],
            ['name' => "Easter Sunday", 'date' => '2025-04-20'],
            ['name' => "Labour Day", 'date' => '2025-05-01'],
            ['name' => "Liberation & Resistance Day", 'date' => '2025-05-25'],
            ['name' => "Eid al-Adha", 'date' => '2025-06-06'],
            ['name' => "Islamic New Year (Muharram)", 'date' => '2025-06-26'],
            ['name' => "Assumption of Mary", 'date' => '2025-08-15'],
            ['name' => "The Prophet’s Birthday", 'date' => '2025-09-04'],
            ['name' => "Independence Day", 'date' => '2025-11-22'],
            ['name' => "Christmas Day", 'date' => '2025-12-25'],

            // 2026
            ['name' => "New Year's Day", 'date' => '2026-01-01'],
            ['name' => "Epiphany / Armenian Christmas", 'date' => '2026-01-06'],
            ['name' => "St Maroun’s Day", 'date' => '2026-02-09'],
            ['name' => "Rafic Hariri Memorial Day", 'date' => '2026-02-14'],
            ['name' => "Eid al-Fitr", 'date' => '2026-03-20'],
            ['name' => "Eid al-Fitr Holiday", 'date' => '2026-03-21'],
            ['name' => "Feast of the Annunciation", 'date' => '2026-03-25'],
            ['name' => "Good Friday", 'date' => '2026-04-03'],
            ['name' => "Easter Sunday", 'date' => '2026-04-05'],
            ['name' => "Easter Monday", 'date' => '2026-04-06'],
            ['name' => "Orthodox Good Friday", 'date' => '2026-04-10'],
            ['name' => "Orthodox Easter Sunday", 'date' => '2026-04-12'],
            ['name' => "Orthodox Easter Monday", 'date' => '2026-04-13'],
            ['name' => "Labour Day", 'date' => '2026-05-01'],
            ['name' => "Martyrs’ Day", 'date' => '2026-05-03'],
            ['name' => "Liberation & Resistance Day", 'date' => '2026-05-10'],
            ['name' => "Eid al-Adha", 'date' => '2026-05-27'],
            ['name' => "Eid al-Adha Holiday", 'date' => '2026-05-28'],
            ['name' => "Eid al-Adha Holiday", 'date' => '2026-05-29'],
            ['name' => "Islamic New Year (Muharram)", 'date' => '2026-06-17'],
            ['name' => "Ashura", 'date' => '2026-06-26'],
            ['name' => "Assumption of Mary", 'date' => '2026-08-15'],
            ['name' => "The Prophet’s Birthday", 'date' => '2026-08-26'],
            ['name' => "Independence Day", 'date' => '2026-11-22'],
            ['name' => "Christmas Day", 'date' => '2026-12-25'],
        ];

        foreach ($holidays as $holiday) {
            PublicHoliday::create($holiday);
        }
    }
}

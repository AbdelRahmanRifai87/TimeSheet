<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Location;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        // Clear the locations table
        Location::truncate();

        // Insert sample locations
        $locations = [
            ['name' => 'Head Office', 'address' => '123 Main Street', 'city' => 'New York', 'state' => 'NY', 'province' => null],
            ['name' => 'Branch Office', 'address' => '456 Elm Street', 'city' => 'Los Angeles', 'state' => 'CA', 'province' => null],
            ['name' => 'Warehouse', 'address' => '789 Oak Avenue', 'city' => 'Chicago', 'state' => 'IL', 'province' => null],
            ['name' => 'Remote Office', 'address' => '101 Pine Road', 'city' => 'Houston', 'state' => 'TX', 'province' => null],
        ];

        foreach ($locations as $location) {
            Location::create($location);
        }
    }
}
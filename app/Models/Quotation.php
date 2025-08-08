<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'client_name',
        'description',
        'status',
        'created_by'    
    ];

    //Relationship with locations (many-to-many throught quotations_locations)
    public function locations()
    {
        return $this->belongsToMany(Location::class, 'quotations_locations')
            ->withPivot('shift_types', 'date_range')
            ->withTimestamps();
    }

    //Relationship with shifts
    public function shifts()
    {
        return $this->hasMany(QuotationShift::class);
    }

    public function locationSchedules()
    {
        return $this->hasMany(QuotationLocationSchedule::class);
    }

    public function scheduledLocations()
    {
        return $this->belongsToMany(Location::class, 'quotation_location_schedules')
                    ->withPivot('shift_details', 'is_configured')
                    ->withTimestamps();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

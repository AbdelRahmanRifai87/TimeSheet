<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExportedTimeSheet extends Model
{
    use HasFactory;

    protected $fillable = [

        'user_id',
        'location_id',
        'date_range',

    ];

    protected $casts = [
        'exported_at' => 'datetime',
    ];

    /**
     * Relationship to User model
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relationship to Timesheet model
     */

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function shifts()
    {
        return $this->hasMany(TimesheetShift::class, 'timesheet_id');
    }
}

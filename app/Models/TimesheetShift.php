<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimesheetShift extends Model
{
    use HasFactory;

    protected $fillable = [
        'timesheet_id',
        'shift_type_id',
        'date',
        'from',
        'to',
        'employees',
    ];

    public function exportedTimesheet()
    {
        return $this->belongsTo(ExportedTimeSheet::class, 'timesheet_id');
    }

    public function shiftType()
    {
        return $this->belongsTo(ShiftType::class);
    }
}

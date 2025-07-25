<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rate extends Model
{
    //
    protected $fillable = ['shift_type_id', 'day_type_id', 'rate'];
    public function dayType()
    {
        return $this->belongsTo(DayType::class);
    }

    public function shiftType()
    {
        return $this->belongsTo(ShiftType::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuotationLocationSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'quotation_id',
        'location_id',
        'shift_details',
        'is_configured'
    ];

    protected $casts = [
        'shift_details' => 'array',
        'is_configured' => 'boolean'
    ];

    public function quotation()
    {
        return $this->belongsTo(Quotation::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}

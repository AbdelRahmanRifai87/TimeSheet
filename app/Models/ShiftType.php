<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftType extends Model
{
    //
    protected $fillable = ['name', 'description'];
    public function rates()
    {
        return $this->hasMany(Rate::class);
    }
}

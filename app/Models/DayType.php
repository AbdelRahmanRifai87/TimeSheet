<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DayType extends Model
{
    //
    protected $fillable = ['name'];
    public function rates()
    {
        return $this->hasMany(Rate::class);
    }
}

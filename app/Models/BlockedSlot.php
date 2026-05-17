<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockedSlot extends Model
{
    protected $fillable = [
        'blocked_date',
        'blocked_time',
        'reason',
    ];
}
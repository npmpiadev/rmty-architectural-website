<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $table = 'services';

    protected $fillable = [
        'title',
        'content',
        'image',
        'is_published',
        'sort_order',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $attributes = [
        'title' => '',
        'content' => '',
        'image' => '',
        'is_published' => true,
        'sort_order' => 0,
    ];
}
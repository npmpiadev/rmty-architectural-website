<?php

namespace App\Models;

use App\Services\ReferenceIdService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use DateTimeInterface;

class Consultation extends Model
{
    protected function serializeDate(DateTimeInterface $date): string
    {
        return $date->format('Y-m-d H:i:s');
    }

    protected $fillable = [
        'reference_id',
        'first_name',
        'last_name',
        'email',
        'phone',
        'location',
        'project_type',
        'message',
        'consultation_date',
        'sms_reminder_sent_at',
        'status',
        'reschedule_reason',
        'is_published',

        'consultation_type',
    'zoom_link',

    ];

    protected $casts = [
        'is_published'          => 'boolean',
        'consultation_date'     => 'datetime',
        'sms_reminder_sent_at'  => 'datetime',
    ];

    // ── Auto-generate reference_id on creation ────────────────────────────
    protected static function booted(): void
    {
        static::creating(function (self $model) {
            if (empty($model->reference_id)) {
                $model->reference_id = ReferenceIdService::forConsultation();
            }
        });
    }

    // ── Scopes ────────────────────────────────────────────────────────────
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('is_published', false);
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->where(function (Builder $q) use ($term) {
            $q->where('first_name', 'like', "%{$term}%")
              ->orWhere('last_name', 'like', "%{$term}%")
              ->orWhere('email', 'like', "%{$term}%")
              ->orWhere('phone', 'like', "%{$term}%")
              ->orWhere('status', 'like', "%{$term}%")
              ->orWhere('reference_id', 'like', "%{$term}%");
        });
    }
}
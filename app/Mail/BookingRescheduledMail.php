<?php

namespace App\Mail;

use App\Models\Consultation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class BookingRescheduledMail extends Mailable
{
    use Queueable, SerializesModels;

    public string  $clientName;
    public string  $projectType;
    public string  $location;
    public string  $consultationDate;
    public string  $consultationTime;
    public string  $rescheduleReason;
    public string  $dashboardUrl;
    public string  $consultationType;   // 'onsite' | 'online'
    public ?string $zoomLink;           // null when onsite

    public function __construct(Consultation $consultation)
    {
        $dt = $consultation->consultation_date
            ? Carbon::parse($consultation->consultation_date)
            : null;

        $consultationType = strtolower(trim((string) ($consultation->consultation_type ?? 'onsite')));

        // Re-resolve the global Zoom link from settings if the record doesn't
        // already have one stored (handles edge cases where the link was updated
        // after the original booking).
        $zoomLink = null;
        if ($consultationType === 'online') {
            $stored = $consultation->zoom_link ?? null;
            if ($stored && $stored !== '') {
                $zoomLink = $stored;
            } else {
                $raw = \App\Models\Setting::getValue('zoom_link', '');
                $zoomLink = (is_string($raw) && $raw !== '') ? $raw : null;
            }
        }

        $this->clientName       = trim($consultation->first_name . ' ' . $consultation->last_name);
        $this->projectType      = $consultation->project_type ?? 'N/A';
        $this->location         = $consultation->location ?? 'N/A';
        $this->consultationDate = $dt ? $dt->format('F j, Y') : '—';
        $this->consultationTime = $dt ? $dt->format('g:i A')  : '—';
        $this->rescheduleReason = $consultation->reschedule_reason ?? '';
        $this->dashboardUrl     = rtrim(config('app.url'), '/') . '/user/dashboard';
        $this->consultationType = $consultationType;
        $this->zoomLink         = $zoomLink;
    }

    public function build(): self
    {
        return $this->subject('Your Consultation Has Been Rebooked — RMTY Designs')
                    ->view('emails.booking-rescheduled');
    }
}
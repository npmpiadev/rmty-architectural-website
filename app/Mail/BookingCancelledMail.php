<?php

namespace App\Mail;

use App\Models\Consultation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Carbon\Carbon;

class BookingCancelledMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $clientName;
    public string $projectType;
    public string $consultationDate;
    public string $consultationTime;
    public string $cancelReason;
    public string $bookingUrl;
    public string $consultationType;  // 'onsite' | 'online'

    public function __construct(Consultation $consultation)
    {
        $dt = $consultation->consultation_date
            ? Carbon::parse($consultation->consultation_date)
            : null;

        $this->clientName        = trim($consultation->first_name . ' ' . $consultation->last_name);
        $this->projectType       = $consultation->project_type ?? 'N/A';
        $this->consultationDate  = $dt ? $dt->format('F j, Y') : '—';
        $this->consultationTime  = $dt ? $dt->format('g:i A')  : '—';
        $this->cancelReason      = $consultation->reschedule_reason ?? '';
        $this->bookingUrl        = rtrim(config('app.url'), '/') . '/appointments';
        $this->consultationType  = strtolower(trim((string) ($consultation->consultation_type ?? 'onsite')));
    }

    public function build(): self
    {
        return $this->subject('Your Consultation Has Been Cancelled — RMTY Designs')
                    ->view('emails.booking-cancelled');
    }
}
<?php

namespace App\Mail;

use App\Models\Consultation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Consultation $consultation) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Consultation is Confirmed — RMTY Designs',
        );
    }

    public function content(): Content
    {
        $date = $this->consultation->consultation_date;

        // Parse the stored datetime string safely
        $dt = $date
            ? \Carbon\Carbon::parse(str_replace(' ', 'T', (string) $date))
            : null;

        $consultationType = strtolower(trim((string) ($this->consultation->consultation_type ?? 'onsite')));

        // zoom_link is already stored on the record by the controller
        // (resolved from global settings at booking time)
        $zoomLink = $consultationType === 'online'
            ? ($this->consultation->zoom_link ?? null)
            : null;

        return new Content(
            view: 'emails.booking-confirmation',
            with: [
                'clientName'       => trim($this->consultation->first_name . ' ' . $this->consultation->last_name),
                'consultationDate' => $dt ? $dt->format('l, F j, Y') : 'To be confirmed',
                'consultationTime' => $dt ? $dt->format('g:i A') : '',
                'projectType'      => $this->consultation->project_type ?? 'N/A',
                'location'         => $this->consultation->location ?? '',
                'phone'            => $this->consultation->phone ?? '',
                'notes'            => $this->consultation->message ?? '',
                'consultationType' => $consultationType,
                'zoomLink'         => $zoomLink,
                'dashboardUrl'     => rtrim(config('app.url'), '/') . '/user/dashboard',
            ],
        );
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\BookingConfirmationMail;
use App\Mail\BookingCancelledMail;
use App\Mail\BookingRescheduledMail;
use App\Http\Controllers\Api\SmsController;

class ConsultationController extends Controller
{
    // GET /api/admin/consultations  (admin)
    public function index(Request $request): JsonResponse
    {
        $query = Consultation::latest();

        if ($search = $request->query('search')) {
            $query->search($search);
        }

        return response()->json($query->get());
    }

  public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'first_name'        => 'required|string|max:255',
        'last_name'         => 'required|string|max:255',
        'email'             => 'required|email|max:255',
        'phone'             => 'nullable|string|max:30',
        'project_type'      => 'nullable|string|max:255',
        'location'          => 'nullable|string|max:255',
        'consultation_date' => 'required|date',
        'message'           => 'nullable|string',
    ]);

    // USER CAN ONLY HAVE ONE ACTIVE CONSULTATION
    $ongoing = Consultation::where('email', $validated['email'])
        ->whereIn('status', ['pending', 'accepted', 'rescheduled'])
        ->where('is_published', 1)
        ->first();

    if ($ongoing) {
        return response()->json([
            'message'      => 'You already have an ongoing consultation.',
            'has_active'   => true,
            'consultation' => $ongoing,
        ], 409);
    }

    $requestedDate = \Carbon\Carbon::parse($validated['consultation_date']);

    // 2-HOUR BUFFER CHECK
    $existingConsultations = Consultation::whereIn('status', [
            'pending',
            'accepted',
            'rescheduled',
        ])
        ->where('is_published', 1)
        ->whereNotNull('consultation_date')
        ->get();

    foreach ($existingConsultations as $existing) {

        $existingDate = \Carbon\Carbon::parse(
            $existing->consultation_date
        );

        $endWindow = $existingDate->copy()->addHours(2);

        // if requested appointment falls within 2-hour window
        if (
            $requestedDate->between(
                $existingDate,
                $endWindow->subMinute()
            )
        ) {
            return response()->json([
                'message' =>
                    'This time slot is unavailable because another consultation is already scheduled.',
            ], 422);
        }
    }

    // CHECK ADMIN BLOCKED SLOTS
    $date = $requestedDate->format('Y-m-d');
    $time = $requestedDate->format('H:i');

    $blocked = \App\Models\BlockedSlot::where(
        'blocked_date',
        $date
    )
        ->where('blocked_time', $time)
        ->exists();

    if ($blocked) {
        return response()->json([
            'message' => 'This slot has been blocked by the admin.',
        ], 422);
    }

    $consultation = Consultation::create([
        ...$validated,
        'status'            => 'accepted',
        'is_published'      => 1,
        'reschedule_reason' => null,
    ]);

    try {
        Mail::to($consultation->email)
            ->send(new BookingConfirmationMail($consultation));
    } catch (\Throwable $e) {
        Log::error(
            'BookingConfirmationMail failed: ' . $e->getMessage()
        );
    }

    return response()->json([
        'message'      => 'Consultation submitted successfully.',
        'data'         => $consultation,
        'reference_id' => $consultation->reference_id,
    ], 201);
}

    // GET /api/consultations/{id}
    public function show($id): JsonResponse
    {
        return response()->json(Consultation::findOrFail($id));
    }

    // GET /api/consultations/ref/{referenceId}
    public function showByReference(string $referenceId): JsonResponse
    {
        $consultation = Consultation::where('reference_id', strtoupper($referenceId))
            ->firstOrFail();

        return response()->json($consultation);
    }

    // PUT /api/consultations/{id}  (admin — sends email on cancel/reschedule, NO SMS)
    public function update(Request $request, $id): JsonResponse
    {
        $consultation = Consultation::findOrFail($id);

        $validated = $request->validate([
            'first_name'        => 'sometimes|string|max:255',
            'last_name'         => 'sometimes|string|max:255',
            'email'             => 'sometimes|email|max:255',
            'phone'             => 'sometimes|nullable|string|max:30',
            'project_type'      => 'sometimes|nullable|string|max:255',
            'location'          => 'sometimes|nullable|string|max:255',
            'consultation_date' => 'sometimes|nullable|date',
            'message'           => 'sometimes|nullable|string',
            'status'            => 'sometimes|string|in:pending,accepted,cancelled,rescheduled,archived',
            'is_published'      => 'sometimes|boolean',
            'reschedule_reason' => 'sometimes|nullable|string|max:1000',
        ]);

        $oldStatus = strtolower(trim((string) $consultation->status));

        $consultation->fill($validated);
        $consultation->save();
        $consultation->refresh();

        $newStatus = strtolower(trim((string) $consultation->status));

        // Send email only (no SMS) when admin cancels or reschedules
        if ($oldStatus !== $newStatus) {
            if ($newStatus === 'cancelled') {
                try {
                    Mail::to($consultation->email)
                        ->send(new BookingCancelledMail($consultation));
                } catch (\Throwable $e) {
                    Log::error('BookingCancelledMail failed: ' . $e->getMessage());
                }
            }

            if ($newStatus === 'rescheduled') {
                try {
                    Mail::to($consultation->email)
                        ->send(new BookingRescheduledMail($consultation));
                } catch (\Throwable $e) {
                    Log::error('BookingRescheduledMail failed: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'message'      => 'Consultation updated successfully.',
            'data'         => $consultation,
            'reference_id' => $consultation->reference_id,
            'old_status'   => $oldStatus,
            'new_status'   => $newStatus,
        ]);
    }

    // DELETE /api/consultations/{id}
    public function destroy($id): JsonResponse
    {
        Consultation::findOrFail($id)->delete();
        return response()->json(['message' => 'Consultation deleted successfully.']);
    }

// POST /api/consultations/{id}/remind
public function remind($id): JsonResponse
{
    $consultation = Consultation::findOrFail($id);

    if (empty($consultation->phone)) {
        return response()->json([
            'message' => 'No phone number on file for this client.',
            'sms_sent' => false,
        ], 422);
    }

    /*
    |--------------------------------------------------------------------------
    | Manual Bell Reminder
    |--------------------------------------------------------------------------
    | This allows the admin to manually send an SMS reminder by clicking the bell.
    | It does not require another "Accept" action because the consultation may
    | already be accepted/confirmed through email or the system flow.
    */
    $allowedStatuses = ['accepted', 'rescheduled', 'pending'];

    if (!in_array(strtolower((string) $consultation->status), $allowedStatuses, true)) {
        return response()->json([
            'message' => 'SMS reminder cannot be sent for this consultation status.',
            'sms_sent' => false,
            'status' => $consultation->status,
        ], 422);
    }

    $message = SmsController::buildReminderMessage($consultation);

    $sent = SmsController::send($consultation->phone, $message);

    return response()->json([
        'message' => $sent
            ? 'Appointment reminder sent successfully.'
            : 'Reminder could not be sent. Check Laravel logs.',
        'sms_sent' => $sent,
        'preview' => $message,
    ], $sent ? 200 : 500);
}

    // GET /api/consultations/my  (client — active only)
    public function my(Request $request): JsonResponse
    {
        $user = $request->user();

        $active = Consultation::where('email', $user->email)
            ->whereIn('status', ['pending', 'accepted', 'rescheduled'])
            ->where('is_published', 1)
            ->latest()
            ->first();

        return response()->json([
            'has_active'   => $active !== null,
            'consultation' => $active,
        ]);
    }

    // GET /api/consultations/my-all  (client — full history)
    public function myAll(Request $request): JsonResponse
    {
        $user = $request->user();

        $consultations = Consultation::where('email', $user->email)
            ->latest()
            ->get();

        return response()->json(['consultations' => $consultations]);
    }
}
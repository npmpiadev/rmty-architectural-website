<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlockedSlot;
use App\Models\Consultation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class BlockedSlotController extends Controller
{
    // ADMIN LIST
    public function index(Request $request): JsonResponse
    {
        $slots = BlockedSlot::orderBy('blocked_date')
            ->orderBy('blocked_time')
            ->get();

        return response()->json($slots);
    }

    // BLOCK SLOT
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slots' => 'required|array|min:1',
            'slots.*.date' => 'required|date',
            'slots.*.time' => 'required|string',
        ]);

        $created = [];

        foreach ($validated['slots'] as $slot) {

            $created[] = BlockedSlot::firstOrCreate([
                'blocked_date' => $slot['date'],
                'blocked_time' => $slot['time'],
            ]);
        }

        return response()->json([
            'message' => 'Slots blocked successfully.',
            'data' => $created,
        ]);
    }

    // DELETE BY ID
    public function destroy($id): JsonResponse
    {
        $slot = BlockedSlot::findOrFail($id);

        $slot->delete();

        return response()->json([
            'message' => 'Slot unblocked.',
        ]);
    }

    // DELETE BY DATE + TIME
    public function destroyByDateTime(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'time' => 'required|string',
        ]);

        BlockedSlot::where('blocked_date', $validated['date'])
            ->where('blocked_time', $validated['time'])
            ->delete();

        return response()->json([
            'message' => 'Slot unblocked.',
        ]);
    }

    // PUBLIC BLOCKED
    public function publicIndex(): JsonResponse
    {
        return response()->json(
            BlockedSlot::orderBy('blocked_date')
                ->orderBy('blocked_time')
                ->get()
        );
    }

    // MAIN UNAVAILABLE SLOTS
    public function unavailableSlots(): JsonResponse
    {
        // ADMIN BLOCKED
        $blocked = BlockedSlot::get()->map(function ($slot) {

            return [
                'blocked_date' => $slot->blocked_date,
                'blocked_time' => $slot->blocked_time,
                'type' => 'blocked',
                'label' => 'Blocked',
                'status' => 'blocked',
            ];
        });

        // CONSULTATIONS
        $consultations = Consultation::whereIn('status', [
                'pending',
                'accepted',
                'rescheduled',
            ])
            ->where('is_published', 1)
            ->whereNotNull('consultation_date')
            ->get();

        $booked = collect();

        foreach ($consultations as $consultation) {

            $start = Carbon::parse(
                $consultation->consultation_date
            );

            // PRIMARY BOOKING
            $booked->push([
    'blocked_date' => $start->format('Y-m-d'),
    'blocked_time' => $start->format('H:i'),

    'type' => 'booked',
    'status' => strtolower($consultation->status ?? 'accepted'),

    'label' =>
        trim(
            ($consultation->first_name ?? '') . ' ' .
            ($consultation->last_name ?? '')
        ),

    'client_name' =>
        trim(
            ($consultation->first_name ?? '') . ' ' .
            ($consultation->last_name ?? '')
        ),

    'first_name' => $consultation->first_name,
    'last_name' => $consultation->last_name,

    'email' => $consultation->email,
    'phone' => $consultation->phone,

    'project_type' => $consultation->project_type,

    'consultation_id' => $consultation->id,

    'consultation_time' =>
        $start->format('g:i A'),

    'is_buffer' => false,
]);

            // 2-HOUR BUFFER
            for ($i = 1; $i < 4; $i++) {

                $buffer = $start
                    ->copy()
                    ->addMinutes($i * 30);

                $booked->push([
    'blocked_date' => $buffer->format('Y-m-d'),
    'blocked_time' => $buffer->format('H:i'),

    'type' => 'buffer',
    'status' => 'buffer',

    'label' => 'Unavailable',

    'client_name' =>
        trim(
            ($consultation->first_name ?? '') . ' ' .
            ($consultation->last_name ?? '')
        ),

    'first_name' => $consultation->first_name,
    'last_name' => $consultation->last_name,

    'email' => $consultation->email,
    'phone' => $consultation->phone,

    'project_type' => $consultation->project_type,

    'consultation_id' => $consultation->id,

    'consultation_time' =>
        $start->format('g:i A'),

    'is_buffer' => true,
]);
            }
        }

        return response()->json(
            $blocked
                ->merge($booked)
                ->values()
        );
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminActivity;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ServiceController extends Controller
{
    private function cleanText(?string $value): string
    {
        return trim((string) ($value ?? ''));
    }

    private function normalizeLineBreaks(?string $value): string
    {
        return str_replace(["\r\n", "\r"], "\n", (string) ($value ?? ''));
    }

    private function normalizeServiceContent(?string $value, int $sortOrder): string
    {
        $text = $this->normalizeLineBreaks($value);

        if ($sortOrder >= 3) {

            $lines = explode("\n", $text);

            $lines = array_map(function ($line) {
                $line = trim($line);
                $line = preg_replace('/^[-•*]\s*/u', '', $line);
                return $line;
            }, $lines);

            $lines = array_values(array_filter($lines, function ($line) {
                return $line !== '';
            }));

            return implode("\n", $lines);
        }

        return trim($text);
    }

    public function index()
    {
        return Service::where('is_published', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function adminIndex()
    {
        return Service::orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function store(Request $request)
    {
        $sortOrder = (int) ($request->input('sort_order') ?? 0);

        $maxSort = Service::max('sort_order');

        $resolvedSortOrder = $request->filled('sort_order')
            ? (int) $request->input('sort_order')
            : (is_null($maxSort) ? 0 : $maxSort + 1);

        $data = [
            'title' => $this->cleanText($request->input('title')),
            'content' => $this->normalizeServiceContent(
                $request->input('content'),
                $resolvedSortOrder
            ),
            'is_published' => $request->has('is_published')
                ? $request->boolean('is_published')
                : true,
            'sort_order' => $resolvedSortOrder,
            'image' => '',
        ];

        if ($request->hasFile('cover_image')) {

            $request->validate([
                'cover_image' => 'image|mimes:jpg,jpeg,png,webp'
            ]);

            $data['image'] = $request
                ->file('cover_image')
                ->store('services', 'public');
        }

        // Fixed sections
        if (in_array($sortOrder, [0, 1, 2], true)) {

            $existing = Service::where('sort_order', $sortOrder)
                ->orderBy('id')
                ->first();

            if ($existing) {

                if (
                    !empty($data['image']) &&
                    !empty($existing->image)
                ) {
                    Storage::disk('public')->delete($existing->image);
                }

                $oldTitle = $existing->title;

                $existing->update($data);

                if ($request->user()) {

                    AdminActivity::create([
                        'user_id' => $request->user()->id,
                        'action' => 'updated',
                        'subject_type' => 'service',
                        'subject_id' => $existing->id,
                        'subject_title' => $existing->title !== ''
                            ? $existing->title
                            : (
                                $oldTitle !== ''
                                    ? $oldTitle
                                    : 'Service ' . $existing->sort_order
                            ),
                    ]);
                }

                return response()->json($existing);
            }
        }

        $service = Service::create($data);

        if ($request->user()) {

            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'created',
                'subject_type' => 'service',
                'subject_id' => $service->id,
                'subject_title' => $service->title !== ''
                    ? $service->title
                    : 'Service ' . $service->sort_order,
            ]);
        }

        return response()->json($service, 201);
    }

    public function update(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $resolvedSortOrder = $request->filled('sort_order')
            ? (int) $request->input('sort_order')
            : $service->sort_order;

        $data = [
            'title' => $this->cleanText($request->input('title')),
            'content' => $this->normalizeServiceContent(
                $request->input('content'),
                $resolvedSortOrder
            ),
            'is_published' => $request->has('is_published')
                ? $request->boolean('is_published')
                : $service->is_published,
            'sort_order' => $resolvedSortOrder,
        ];

        // Upload new image
        if ($request->hasFile('cover_image')) {

            $request->validate([
                'cover_image' => 'image|mimes:jpg,jpeg,png,webp'
            ]);

            if (!empty($service->image)) {
                Storage::disk('public')->delete($service->image);
            }

            $data['image'] = $request
                ->file('cover_image')
                ->store('services', 'public');
        }

        // Remove image
        elseif ($request->input('cover_image') === 'REMOVE') {

            if (!empty($service->image)) {
                Storage::disk('public')->delete($service->image);
            }

            // FIXED HERE
            $data['image'] = '';
        }

        $oldTitle = $service->title;

        $service->update($data);

        if ($request->user()) {

            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'updated',
                'subject_type' => 'service',
                'subject_id' => $service->id,
                'subject_title' => $service->title !== ''
                    ? $service->title
                    : (
                        $oldTitle !== ''
                            ? $oldTitle
                            : 'Service ' . $service->sort_order
                    ),
            ]);
        }

        return response()->json($service);
    }

    public function destroy(Request $request, $id)
    {
        $service = Service::findOrFail($id);

        $title = $service->title;

        if (!empty($service->image)) {
            Storage::disk('public')->delete($service->image);
        }

        $service->delete();

        if ($request->user()) {

            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'deleted',
                'subject_type' => 'service',
                'subject_id' => (int) $id,
                'subject_title' => $title !== ''
                    ? $title
                    : 'Service ' . $id,
            ]);
        }

        return response()->json([
            'message' => 'Deleted'
        ]);
    }
}
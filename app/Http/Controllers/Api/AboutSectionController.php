<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AboutSection;
use App\Models\AdminActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AboutSectionController extends Controller
{
    private function cleanText($value): string
    {
        return trim((string) ($value ?? ''));
    }

    public function index()
    {
        return AboutSection::where('is_published', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function adminIndex()
    {
        return AboutSection::orderBy('sort_order')
            ->orderBy('id')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string',
            'content' => 'nullable|string',
            'is_published' => 'sometimes',
            'sort_order' => 'sometimes|integer|min:0',
            'cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp',
        ]);

        $maxSort = AboutSection::max('sort_order');

        $data = [
            'title' => $this->cleanText($request->input('title')),
            'content' => $this->cleanText($request->input('content')),
            'is_published' => $request->has('is_published')
                ? (bool) $request->input('is_published')
                : true,
            'sort_order' => $request->filled('sort_order')
                ? (int) $request->input('sort_order')
                : (is_null($maxSort) ? 0 : $maxSort + 1),
            'image' => '',
        ];

        if ($request->hasFile('cover_image')) {
            $data['image'] = $request
                ->file('cover_image')
                ->store('about', 'public');
        }

        $section = AboutSection::create($data);

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'created',
                'subject_type' => 'about_section',
                'subject_id' => $section->id,
                'subject_title' => $section->title !== ''
                    ? $section->title
                    : 'Section ' . $section->sort_order,
            ]);
        }

        return response()->json($section, 201);
    }

    public function update(Request $request, $id)
    {
        $section = AboutSection::findOrFail($id);

        $validated = $request->validate([
            'title' => 'nullable|string',
            'content' => 'nullable|string',
            'is_published' => 'sometimes',
            'sort_order' => 'sometimes|integer|min:0',
            'cover_image' => 'nullable',
        ]);

        $data = [
            'title' => $this->cleanText($request->input('title')),
            'content' => $this->cleanText($request->input('content')),
            'is_published' => $request->has('is_published')
                ? (bool) $request->input('is_published')
                : $section->is_published,
            'sort_order' => $request->filled('sort_order')
                ? (int) $request->input('sort_order')
                : $section->sort_order,
        ];

        // Upload new image
        if ($request->hasFile('cover_image')) {

            $request->validate([
                'cover_image' => 'image|mimes:jpg,jpeg,png,webp',
            ]);

            if ($section->image) {
                Storage::disk('public')->delete($section->image);
            }

            $data['image'] = $request
                ->file('cover_image')
                ->store('about', 'public');
        }

        // Remove image
        elseif ($request->input('cover_image') === 'REMOVE') {

            if ($section->image) {
                Storage::disk('public')->delete($section->image);
            }

            $data['image'] = '';
        }

        $oldTitle = $section->title;

        $section->update($data);

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'updated',
                'subject_type' => 'about_section',
                'subject_id' => $section->id,
                'subject_title' => $section->title !== ''
                    ? $section->title
                    : ($oldTitle !== ''
                        ? $oldTitle
                        : 'Section ' . $section->sort_order),
            ]);
        }

        return response()->json($section);
    }

    public function destroy(Request $request, $id)
    {
        $section = AboutSection::findOrFail($id);

        $title = $section->title;

        if ($section->image) {
            Storage::disk('public')->delete($section->image);
        }

        $section->delete();

        if ($request->user()) {
            AdminActivity::create([
                'user_id' => $request->user()->id,
                'action' => 'deleted',
                'subject_type' => 'about_section',
                'subject_id' => (int) $id,
                'subject_title' => $title !== ''
                    ? $title
                    : 'Section ' . $section->sort_order,
            ]);
        }

        return response()->json([
            'message' => 'Deleted successfully',
        ]);
    }
}
<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;

class StorageController extends Controller
{
    public function show(string $path)
    {
        $decodedPath = urldecode($path);

        if ($decodedPath === '' || str_contains($decodedPath, '..')) {
            abort(404);
        }

        if (! Storage::disk('public')->exists($decodedPath)) {
            abort(404);
        }

        $filePath = Storage::disk('public')->path($decodedPath);
        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
        $contents = Storage::disk('public')->get($decodedPath);

        return response($contents, 200, ['Content-Type' => $mimeType]);
    }
}

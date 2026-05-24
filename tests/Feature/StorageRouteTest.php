<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StorageRouteTest extends TestCase
{
    public function test_storage_route_serves_public_files_without_symlink(): void
    {
        $source = public_path('images/rmty-logo.jpg');

        Storage::disk('public')->put('test/hero-image.jpg', file_get_contents($source));

        $response = $this->get('/storage/test/hero-image.jpg');

        $response->assertOk();
        $response->assertHeader('content-type', 'image/jpeg');

        Storage::disk('public')->delete('test/hero-image.jpg');
    }
}

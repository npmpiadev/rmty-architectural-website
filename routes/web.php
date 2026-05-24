<?php

use App\Http\Controllers\StorageController;
use Illuminate\Support\Facades\Route;

Route::get('/storage/{path}', [StorageController::class, 'show'])
    ->where('path', '.+')
    ->name('storage.show');

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api).*$');

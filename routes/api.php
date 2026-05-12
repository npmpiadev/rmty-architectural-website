<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\AboutSectionController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\AdminManagementController;
use App\Http\Controllers\Api\InquiryController;
use App\Http\Controllers\Api\GoogleOAuthController;
use App\Http\Controllers\Api\FacebookOAuthController;
use App\Http\Controllers\Api\ConsultationController;
use App\Http\Controllers\Api\BlockedSlotController;
use App\Http\Controllers\Api\HomePageContentController;
use App\Http\Controllers\Api\ContactPageContentController;
use App\Http\Controllers\Api\FaqController;
use App\Http\Controllers\Webhooks\MetaWebhookController;
use App\Http\Controllers\Webhooks\GmailWebhookController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\ClientPasswordResetController;

 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Inquiry;
use App\Http\Controllers\Api\AuthController;

Route::post('/admin/login', [AdminAuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/dashboard', function () {
        return response()->json(['message' => 'Welcome Admin']);
    });

    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    Route::get('/admin/me', [AdminManagementController::class, 'getCurrentAdmin']);
    Route::post('/admin/profile', [AdminAuthController::class, 'updateProfile']);
    Route::get('/admin/profile/activities', [AdminManagementController::class, 'getProfileActivities']);
    
    // ── Global Search Route (Protected) ──
    Route::get('/admin/search', [SearchController::class, 'globalSearch']);
});

Route::get('/consultations/ref/{referenceId}', [ConsultationController::class, 'showByReference']);

Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/projects/{slug}', [ProjectController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']);

Route::get('/services', [ServiceController::class, 'index']);
Route::get('/about', [AboutSectionController::class, 'index']);
Route::get('/faqs', [FaqController::class, 'index']);
Route::get('/home-content', [HomePageContentController::class, 'index']);
Route::get('/contact-content', [ContactPageContentController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/projects', [ProjectController::class, 'adminIndex']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::post('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);
    Route::delete('/projects/{id}/gallery/{imageId}', [ProjectController::class, 'deleteGalleryImage']);

    Route::get('/admin/services', [ServiceController::class, 'adminIndex']);
    Route::post('/services', [ServiceController::class, 'store']);
    Route::put('/services/{id}', [ServiceController::class, 'update']);
    Route::post('/services/{id}', [ServiceController::class, 'update']);
    Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

    Route::get('/admin/about', [AboutSectionController::class, 'adminIndex']);
    Route::post('/about', [AboutSectionController::class, 'store']);
    Route::put('/about/{id}', [AboutSectionController::class, 'update']);
    Route::post('/about/{id}', [AboutSectionController::class, 'update']);
    Route::delete('/about/{id}', [AboutSectionController::class, 'destroy']);

    Route::get('/admin/faqs', [FaqController::class, 'adminIndex']);
    Route::post('/faqs', [FaqController::class, 'store']);
    Route::put('/faqs/{id}', [FaqController::class, 'update']);
    Route::post('/faqs/{id}', [FaqController::class, 'update']);
    Route::delete('/faqs/{id}', [FaqController::class, 'destroy']);

    Route::get('/admin/home-content', [HomePageContentController::class, 'index']);
    Route::post('/admin/home-content', [HomePageContentController::class, 'store']);

    Route::get('/admin/contact-content', [ContactPageContentController::class, 'index']);
    Route::post('/admin/contact-content', [ContactPageContentController::class, 'store']);
});
Route::prefix('client')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

    Route::post('/forgot-password',   [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:5,1');   // 5 requests/min per IP
 
    Route::post('/verify-reset-otp',  [AuthController::class, 'verifyResetOtp'])
        ->middleware('throttle:10,1');
 
    Route::post('/reset-password',    [AuthController::class, 'resetPassword'])
        ->middleware('throttle:10,1');
});

// Consultation booking — public (contact form)
Route::post('/inquiries', [InquiryController::class, 'store']);
Route::post('/consultations', [ConsultationController::class, 'store']);

// Public — unavailable slots for client calendar
Route::get('/blocked-slots', [BlockedSlotController::class, 'publicIndex']);
Route::get('/booked-slots',  [BlockedSlotController::class, 'bookedSlots']);

Route::post('password/send-otp', [PasswordResetController::class, 'sendOtp']);
Route::post('password/verify-otp', [PasswordResetController::class, 'verifyOtp']);
Route::post('password/reset', [PasswordResetController::class, 'resetPassword']);

// Admin CRUD operations (require login)
Route::middleware('auth:sanctum')->group(function () {
        Route::post('/admins/{id}/promote', [AdminManagementController::class, 'promote']);
    Route::post('/admins/{id}/demote', [AdminManagementController::class, 'demote']);
    Route::get('/admins', [AdminManagementController::class, 'index']);
    Route::get('/admins/{id}', [AdminManagementController::class, 'show']);
    Route::post('/admins', [AdminManagementController::class, 'store']);
    Route::put('/admins/{id}', [AdminManagementController::class, 'update']);
    Route::patch('/admins/{id}', [AdminManagementController::class, 'update']);
    Route::delete('/admins/{id}', [AdminManagementController::class, 'destroy']);
    Route::get('/admins/{id}/can-delete', [AdminManagementController::class, 'canDelete']);
    Route::post('/admins/{id}/archive', [AdminManagementController::class, 'archive']);
    Route::post('/admins/{id}/restore', [AdminManagementController::class, 'restore']);
Route::post('/admins/{id}/verify-otp', [AdminManagementController::class, 'verifyOtp']);
Route::post('/admins/{id}/resend-otp', [AdminManagementController::class, 'resendOtp']);

    Route::get('/inquiries/stats', [InquiryController::class, 'stats']);
    Route::get('/inquiries', [InquiryController::class, 'index']);
    Route::get('/inquiries/{inquiry}', [InquiryController::class, 'show']);
    Route::put('/inquiries/{inquiry}', [InquiryController::class, 'update']);
    Route::delete('/inquiries/{inquiry}', [InquiryController::class, 'destroy']);
    Route::post('/inquiries/{inquiry}/reply', [InquiryController::class, 'reply']);
        Route::get('/inquiries/ref/{referenceId}', [InquiryController::class, 'showByReference']);




   // Consultations (admin management)
Route::get('/admin/consultations', [ConsultationController::class, 'index']);
Route::put('/consultations/{id}', [ConsultationController::class, 'update']);
Route::post('/consultations/{id}', [ConsultationController::class, 'update']);
Route::delete('/consultations/{id}', [ConsultationController::class, 'destroy']);

// Manual SMS reminder from admin bell button
Route::post('/consultations/{id}/remind', [ConsultationController::class, 'remind']);

// Client consultation history
Route::get('/consultations/my', [ConsultationController::class, 'my']);
Route::get('/consultations/my-all', [ConsultationController::class, 'myAll']);

    // Blocked slots (admin management)
    Route::get('/admin/blocked-slots',    [BlockedSlotController::class, 'index']);
    Route::post('/admin/blocked-slots',   [BlockedSlotController::class, 'store']);
    Route::delete('/admin/blocked-slots/by-date-time', [BlockedSlotController::class, 'destroyByDateTime']);
    Route::delete('/admin/blocked-slots/{id}', [BlockedSlotController::class, 'destroy']);
});

// Public
Route::get('/settings/projects-cta', [ProjectController::class, 'getProjectsCta']);

// Admin (protected)
Route::post('/admin/settings/projects-cta', [ProjectController::class, 'updateProjectsCta'])
    ->middleware('auth:sanctum');

// ── OAuth Callbacks (public — no auth, Google/Facebook redirect here) ──
Route::get('/admin/google/callback', [GoogleOAuthController::class, 'handleCallback']);
Route::get('/admin/facebook/callback', [FacebookOAuthController::class, 'handleCallback']);

// ── Platform Settings (protected) ────────────────────────────
Route::get('/admin/google/auth-url', [GoogleOAuthController::class, 'getAuthUrl']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/google/auth-url', [GoogleOAuthController::class, 'getAuthUrl']);
    Route::get('/admin/google/status', [GoogleOAuthController::class, 'status']);
    Route::delete('/admin/google/disconnect', [GoogleOAuthController::class, 'disconnect']);

    Route::post('/admin/facebook/connect-manual', [FacebookOAuthController::class, 'connectManual']);
    Route::post('/admin/instagram/connect-manual', [FacebookOAuthController::class, 'connectInstagramManual']);
    Route::delete('/admin/instagram/disconnect', [FacebookOAuthController::class, 'disconnectInstagram']);

    Route::get('/admin/facebook/auth-url', [FacebookOAuthController::class, 'getAuthUrl']);
    Route::get('/admin/facebook/status', [FacebookOAuthController::class, 'status']);
    Route::delete('/admin/facebook/disconnect', [FacebookOAuthController::class, 'disconnect']);
});
// ── Webhook Routes (public — verified by platform signatures) ──
Route::prefix('webhooks')->middleware('throttle:120,1')->group(function () {
    Route::post('/gmail', [GmailWebhookController::class, 'handle']);
    Route::get('/meta', [MetaWebhookController::class, 'verify']);
    Route::post('/meta', [MetaWebhookController::class, 'handle']);
});
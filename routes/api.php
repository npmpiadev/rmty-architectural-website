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
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\AuthController;

use App\Http\Controllers\Webhooks\MetaWebhookController;
use App\Http\Controllers\Webhooks\GmailWebhookController;

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

Route::post('/admin/login', [AdminAuthController::class, 'login']);

Route::prefix('client')->group(function () {

    Route::post('/register', [AuthController::class, 'register']);

    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);

    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1');

    Route::post('/logout', [AuthController::class, 'logout'])
        ->middleware('auth:sanctum');

    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
        ->middleware('throttle:5,1');

    Route::post('/verify-reset-otp', [AuthController::class, 'verifyResetOtp'])
        ->middleware('throttle:10,1');

    Route::post('/reset-password', [AuthController::class, 'resetPassword'])
        ->middleware('throttle:10,1');
});

/*
|--------------------------------------------------------------------------
| PASSWORD RESET
|--------------------------------------------------------------------------
*/

Route::post('password/send-otp', [PasswordResetController::class, 'sendOtp']);

Route::post('password/verify-otp', [PasswordResetController::class, 'verifyOtp']);

Route::post('password/reset', [PasswordResetController::class, 'resetPassword']);

/*
|--------------------------------------------------------------------------
| PUBLIC CONTENT
|--------------------------------------------------------------------------
*/

Route::get('/projects', [ProjectController::class, 'index']);
Route::get('/projects/{slug}', [ProjectController::class, 'show']);

Route::get('/categories', [CategoryController::class, 'index']);

Route::get('/services', [ServiceController::class, 'index']);

Route::get('/about', [AboutSectionController::class, 'index']);

Route::get('/faqs', [FaqController::class, 'index']);

Route::get('/home-content', [HomePageContentController::class, 'index']);

Route::get('/contact-content', [ContactPageContentController::class, 'index']);

Route::get('/settings/projects-cta', [ProjectController::class, 'getProjectsCta']);

/*
|--------------------------------------------------------------------------
| PUBLIC CONSULTATIONS
|--------------------------------------------------------------------------
*/

Route::post('/consultations', [ConsultationController::class, 'store']);

Route::get(
    '/consultations/ref/{referenceId}',
    [ConsultationController::class, 'showByReference']
);

/*
|--------------------------------------------------------------------------
| PUBLIC INQUIRIES
|--------------------------------------------------------------------------
*/

Route::post('/inquiries', [InquiryController::class, 'store']);

/*
|--------------------------------------------------------------------------
| PUBLIC CALENDAR / BLOCKED SLOTS
|--------------------------------------------------------------------------
*/

Route::get(
    '/blocked-slots',
    [BlockedSlotController::class, 'publicIndex']
);

Route::get(
    '/booked-slots',
    [BlockedSlotController::class, 'unavailableSlots']
);

Route::get(
    '/unavailable-slots',
    [BlockedSlotController::class, 'unavailableSlots']
);

/*
|--------------------------------------------------------------------------
| ADMIN AUTH PROTECTED
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | ADMIN DASHBOARD
    |--------------------------------------------------------------------------
    */

    Route::get('/admin/dashboard', function () {
        return response()->json([
            'message' => 'Welcome Admin'
        ]);
    });

    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);

    Route::get('/admin/me', [AdminManagementController::class, 'getCurrentAdmin']);

    Route::post('/admin/profile', [AdminAuthController::class, 'updateProfile']);

    Route::get(
        '/admin/profile/activities',
        [AdminManagementController::class, 'getProfileActivities']
    );

    Route::get(
        '/admin/search',
        [SearchController::class, 'globalSearch']
    );

    /*
    |--------------------------------------------------------------------------
    | PROJECTS
    |--------------------------------------------------------------------------
    */

    Route::get('/admin/projects', [ProjectController::class, 'adminIndex']);

    Route::post('/projects', [ProjectController::class, 'store']);

    Route::put('/projects/{id}', [ProjectController::class, 'update']);

    Route::post('/projects/{id}', [ProjectController::class, 'update']);

    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);

    Route::delete(
        '/projects/{id}/gallery/{imageId}',
        [ProjectController::class, 'deleteGalleryImage']
    );

    /*
    |--------------------------------------------------------------------------
    | SERVICES
    |--------------------------------------------------------------------------
    */

    Route::get('/admin/services', [ServiceController::class, 'adminIndex']);

    Route::post('/services', [ServiceController::class, 'store']);

    Route::put('/services/{id}', [ServiceController::class, 'update']);

    Route::post('/services/{id}', [ServiceController::class, 'update']);

    Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | ABOUT
    |--------------------------------------------------------------------------
    */

    Route::get('/admin/about', [AboutSectionController::class, 'adminIndex']);

    Route::post('/about', [AboutSectionController::class, 'store']);

    Route::put('/about/{id}', [AboutSectionController::class, 'update']);

    Route::post('/about/{id}', [AboutSectionController::class, 'update']);

    Route::delete('/about/{id}', [AboutSectionController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | FAQS
    |--------------------------------------------------------------------------
    */

    Route::get('/admin/faqs', [FaqController::class, 'adminIndex']);

    Route::post('/faqs', [FaqController::class, 'store']);

    Route::put('/faqs/{id}', [FaqController::class, 'update']);

    Route::post('/faqs/{id}', [FaqController::class, 'update']);

    Route::delete('/faqs/{id}', [FaqController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | HOME / CONTACT CONTENT
    |--------------------------------------------------------------------------
    */

    Route::get('/admin/home-content', [HomePageContentController::class, 'index']);

    Route::post('/admin/home-content', [HomePageContentController::class, 'store']);

    Route::get('/admin/contact-content', [ContactPageContentController::class, 'index']);

    Route::post('/admin/contact-content', [ContactPageContentController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | ADMIN MANAGEMENT
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | INQUIRIES
    |--------------------------------------------------------------------------
    */

    Route::get('/inquiries/stats', [InquiryController::class, 'stats']);

    Route::get('/inquiries', [InquiryController::class, 'index']);

    Route::get('/inquiries/{inquiry}', [InquiryController::class, 'show']);

    Route::put('/inquiries/{inquiry}', [InquiryController::class, 'update']);

    Route::delete('/inquiries/{inquiry}', [InquiryController::class, 'destroy']);

    Route::post('/inquiries/{inquiry}/reply', [InquiryController::class, 'reply']);

    Route::get(
        '/inquiries/ref/{referenceId}',
        [InquiryController::class, 'showByReference']
    );

    /*
    |--------------------------------------------------------------------------
    | CONSULTATIONS
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/admin/consultations',
        [ConsultationController::class, 'index']
    );

<<<<<<< HEAD
   // Consultations (admin management)
Route::get('/admin/consultations', [ConsultationController::class, 'index']);
Route::put('/consultations/{id}', [ConsultationController::class, 'update']);
Route::post('/consultations/{id}', [ConsultationController::class, 'update']);
Route::delete('/consultations/{id}', [ConsultationController::class, 'destroy']);
    Route::get('/settings/zoom-link', [ConsultationController::class, 'getZoomLink']);
    Route::put('/settings/zoom-link', [ConsultationController::class, 'setZoomLink']);
=======
    Route::put(
        '/consultations/{id}',
        [ConsultationController::class, 'update']
    );
>>>>>>> 7f8110979769dfbf47ca9ff4cb0c8a55ae1e263c

    Route::post(
        '/consultations/{id}',
        [ConsultationController::class, 'update']
    );

    Route::delete(
        '/consultations/{id}',
        [ConsultationController::class, 'destroy']
    );

    Route::post(
        '/consultations/{id}/remind',
        [ConsultationController::class, 'remind']
    );

    Route::get(
        '/consultations/my',
        [ConsultationController::class, 'my']
    );

    Route::get(
        '/consultations/my-all',
        [ConsultationController::class, 'myAll']
    );

    /*
    |--------------------------------------------------------------------------
    | BLOCKED SLOTS
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/admin/blocked-slots',
        [BlockedSlotController::class, 'index']
    );

    Route::post(
        '/admin/blocked-slots',
        [BlockedSlotController::class, 'store']
    );

    // IMPORTANT: PLACE THIS BEFORE {id}
    Route::delete(
        '/admin/blocked-slots/by-date-time',
        [BlockedSlotController::class, 'destroyByDateTime']
    );

    Route::delete(
        '/admin/blocked-slots/{id}',
        [BlockedSlotController::class, 'destroy']
    );

    /*
    |--------------------------------------------------------------------------
    | SETTINGS
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/admin/settings/projects-cta',
        [ProjectController::class, 'updateProjectsCta']
    );

    /*
    |--------------------------------------------------------------------------
    | GOOGLE / FACEBOOK
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/admin/google/auth-url',
        [GoogleOAuthController::class, 'getAuthUrl']
    );

    Route::get(
        '/admin/google/status',
        [GoogleOAuthController::class, 'status']
    );

    Route::delete(
        '/admin/google/disconnect',
        [GoogleOAuthController::class, 'disconnect']
    );

    Route::post(
        '/admin/facebook/connect-manual',
        [FacebookOAuthController::class, 'connectManual']
    );

    Route::post(
        '/admin/instagram/connect-manual',
        [FacebookOAuthController::class, 'connectInstagramManual']
    );

    Route::delete(
        '/admin/instagram/disconnect',
        [FacebookOAuthController::class, 'disconnectInstagram']
    );

    Route::get(
        '/admin/facebook/auth-url',
        [FacebookOAuthController::class, 'getAuthUrl']
    );

    Route::get(
        '/admin/facebook/status',
        [FacebookOAuthController::class, 'status']
    );

    Route::delete(
        '/admin/facebook/disconnect',
        [FacebookOAuthController::class, 'disconnect']
    );
});

/*
|--------------------------------------------------------------------------
| OAUTH CALLBACKS
|--------------------------------------------------------------------------
*/

Route::get(
    '/admin/google/callback',
    [GoogleOAuthController::class, 'handleCallback']
);

Route::get(
    '/admin/facebook/callback',
    [FacebookOAuthController::class, 'handleCallback']
);

/*
|--------------------------------------------------------------------------
| WEBHOOKS
|--------------------------------------------------------------------------
*/

Route::prefix('webhooks')
    ->middleware('throttle:120,1')
    ->group(function () {

        Route::post('/gmail', [GmailWebhookController::class, 'handle']);

        Route::get('/meta', [MetaWebhookController::class, 'verify']);

        Route::post('/meta', [MetaWebhookController::class, 'handle']);
    });
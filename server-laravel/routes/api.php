<?php
// routes/api.php — Toàn bộ API routes cho NoteApp
// ═══════════════════════════════════════════════

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\LabelController;
use App\Http\Controllers\NoteAttachmentController;
use App\Http\Controllers\NoteShareController;
use Illuminate\Support\Facades\Route;

// ── PUBLIC ROUTES (không cần auth) ──

// Tiêu chí 1: Đăng ký
Route::post('/auth/register', [AuthController::class, 'register']);

// Tiêu chí 2: Kích hoạt tài khoản
Route::post('/auth/activate', [AuthController::class, 'activate']);

// Tiêu chí 3: Đăng nhập
Route::post('/auth/login', [AuthController::class, 'login']);

// Tiêu chí 4: Quên mật khẩu + Reset
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// Fix 1.3: Public shared note access (no auth required)
Route::get('/shares/public/{noteId}', [NoteShareController::class, 'showPublic']);

// Public join route (requires auth - auto-add public note to user's shared list)
Route::middleware('auth:sanctum')->post('/shares/public-join/{noteId}', [NoteShareController::class, 'publicJoin']);

// ── PROTECTED ROUTES (cần Sanctum auth) ──

Route::middleware('auth:sanctum')->group(function () {

    // Tiêu chí 3: Đăng xuất
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Resend activation email
    Route::post('/auth/resend-activation', [AuthController::class, 'resendActivation']);

    // Tiêu chí 7: Đổi mật khẩu
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // Tiêu chí 5, 6: Profile
    Route::get('/users/me', [UserController::class, 'show']);
    Route::put('/users/me', [UserController::class, 'update']);
    Route::delete('/users/me', [UserController::class, 'destroy']);

    // Tiêu chí 8: Preferences
    Route::get('/users/preferences', [UserController::class, 'preferences']);
    Route::put('/users/preferences', [UserController::class, 'updatePreferences']);

    // Tiêu chí 17: Pin/Unpin — MUST be before apiResource to avoid conflict
    Route::put('/notes/toggle-pin', [NoteController::class, 'togglePin']);

    // Tiêu chí 18: Lock/Unlock — MUST be before apiResource
    Route::post('/notes/lock', [NoteController::class, 'lock']);

    // Tiêu chí 21, 26: Polling — MUST be before apiResource
    Route::get('/notes/poll', [NoteController::class, 'poll']);

    // Tiêu chí 9-16: Notes CRUD
    Route::apiResource('notes', NoteController::class);

    // Tiêu chí 19: Labels CRUD
    Route::apiResource('labels', LabelController::class);

    // Tiêu chí 20: Attachments
    Route::post('/attachments', [NoteAttachmentController::class, 'store']);
    Route::delete('/attachments/{attachment}', [NoteAttachmentController::class, 'destroy']);

    // Tiêu chí 25: Share
    Route::get('/shares', [NoteShareController::class, 'index']);
    Route::get('/shares/poll', [NoteShareController::class, 'poll']);
    Route::post('/shares/validate', [NoteShareController::class, 'validateShare']);
    Route::post('/shares', [NoteShareController::class, 'store']);
    Route::put('/shares/role', [NoteShareController::class, 'updateRole']);
    Route::post('/shares/mark-as-seen', [NoteShareController::class, 'markAsSeen']);
    Route::delete('/shares', [NoteShareController::class, 'destroy']);
});

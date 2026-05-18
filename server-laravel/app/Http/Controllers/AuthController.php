<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Tiêu chí 1: Đăng ký tài khoản
     * Tiêu chí 2: Gửi email kích hoạt
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $activationToken = Str::random(64);

        $user = User::create([
            'email'             => $request->email,
            'username'          => $request->username,
            'display_name'      => $request->displayName,
            'password'          => Hash::make($request->password), // bcrypt
            'is_active'         => false,
            'activation_token'  => $activationToken,
            'activation_expiry' => now()->addHours(24),
        ]);

        // Gửi email kích hoạt (Tiêu chí 2)
        $activationLink = env('FRONTEND_URL', 'http://localhost:5173')
            . '/activate?token=' . $activationToken;

        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->CharSet = 'UTF-8';
            $mail->isSMTP();
            $mail->Host       = env('MAIL_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth   = true;
            $mail->Username   = env('MAIL_USERNAME');
            $mail->Password   = env('MAIL_PASSWORD');
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = (int) env('MAIL_PORT', 587);

            // Gmail yêu cầu From phải trùng với Username đăng nhập
            $mail->setFrom(env('MAIL_USERNAME'), env('MAIL_FROM_NAME', 'NoteApp'));
            $mail->addAddress($user->email, $user->display_name);

            $mail->isHTML(true);
            $mail->Subject = '=?UTF-8?B?' . base64_encode('Kích hoạt tài khoản NoteApp') . '?=';
            $mail->Body    = "Xin chào <b>{$user->display_name}</b>,<br><br>Vui lòng kích hoạt tài khoản bằng link sau:<br><a href='{$activationLink}'>{$activationLink}</a><br><br>Link có hiệu lực 24 giờ.";
            $mail->AltBody = "Xin chào {$user->display_name},\n\nVui lòng kích hoạt tài khoản bằng link sau:\n{$activationLink}\n\nLink có hiệu lực 24 giờ.";

            $mail->send();
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Đăng ký thành công nhưng không gửi được email.',
                'debug_error' => $mail->ErrorInfo ?? $e->getMessage()
            ], 500);
        }

        // Tiêu chí 2.1: Auto-login sau đăng ký — tạo token Sanctum
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký thành công! Kiểm tra email để kích hoạt tài khoản.',
            'token'   => $token,
            'user'    => $user->makeHidden(['password', 'activation_token', 'reset_token']),
        ], 201);
    }

    /**
     * Tiêu chí 2: Kích hoạt tài khoản
     */
    public function activate(Request $request): JsonResponse
    {
        $request->validate(['token' => 'required|string']);

        $token = $request->token;
        \Illuminate\Support\Facades\Log::info("Activation attempt started. Token: " . $token);

        $user = User::where('activation_token', $token)->first();

        // Token not found — could be already consumed (idempotency)
        if (!$user) {
            \Illuminate\Support\Facades\Log::warning("Token not found in users table. Token: " . $token);

            // Check if any active user exists (token was already used successfully)
            // This handles React StrictMode double-call race condition
            $alreadyActivated = User::where('is_active', true)
                ->whereNull('activation_token')
                ->where('updated_at', '>=', now()->subMinutes(5))
                ->exists();

            if ($alreadyActivated) {
                \Illuminate\Support\Facades\Log::info("Idempotent check: User already activated recently.");
                return response()->json([
                    'success' => true,
                    'message' => 'Tài khoản đã được kích hoạt thành công!',
                ]);
            }

            return response()->json(['error' => 'Token không hợp lệ hoặc đã hết hạn.'], 400);
        }

        if ($user->activation_expiry && $user->activation_expiry->isPast()) {
            \Illuminate\Support\Facades\Log::warning("Token expired for User ID: " . $user->id);
            return response()->json(['error' => 'Token đã hết hạn. Vui lòng đăng ký lại.'], 400);
        }

        // Already active — return success (idempotent)
        if ($user->is_active) {
            \Illuminate\Support\Facades\Log::info("User already active. ID: " . $user->id);
            return response()->json([
                'success' => true,
                'message' => 'Tài khoản đã được kích hoạt trước đó!',
            ]);
        }

        \Illuminate\Support\Facades\Log::info("Attempting to update is_active to 1 for User ID: " . $user->id);
        
        // Execute the update
        $updated = $user->update([
            'is_active'         => true, // Laravel's boolean cast handles converting true to 1 for tinyint
            'activation_token'  => null,
            'activation_expiry' => null,
        ]);

        if (!$updated) {
            \Illuminate\Support\Facades\Log::error("Database UPDATE failed for User ID: " . $user->id);
            return response()->json(['error' => 'Lỗi hệ thống khi cập nhật trạng thái kích hoạt.'], 500);
        }

        \Illuminate\Support\Facades\Log::info("Activation successful for User ID: " . $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Kích hoạt tài khoản thành công! Bạn có thể đăng nhập ngay.',
        ]);
    }

    /**
     * Tiêu chí 3: Đăng nhập — Laravel Sanctum token
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['error' => 'Tài khoản không tồn tại'], 404);
        }

        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Mật khẩu không đúng'], 401);
        }

        // Token generation and return (Tiêu chí 3)
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => [
                'id'           => $user->id,
                'email'        => $user->email,
                'username'     => $user->username,
                'display_name' => $user->display_name,
                'avatar'       => $user->avatar,
                'is_active'    => $user->is_active,
            ],
        ]);
    }

    /**
     * Tiêu chí 3: Đăng xuất
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đăng xuất thành công',
        ]);
    }

    /**
     * Resend activation email (requires auth)
     */
    public function resendActivation(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->is_active) {
            return response()->json(['error' => 'Tài khoản đã được kích hoạt.'], 400);
        }

        $activationToken = Str::random(64);
        $user->update([
            'activation_token'  => $activationToken,
            'activation_expiry' => now()->addHours(24),
        ]);

        $activationLink = env('FRONTEND_URL', 'http://localhost:5173')
            . '/activate?token=' . $activationToken;

        try {
            $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
            $mail->CharSet = 'UTF-8';
            $mail->isSMTP();
            $mail->Host       = env('MAIL_HOST', 'smtp.gmail.com');
            $mail->SMTPAuth   = true;
            $mail->Username   = env('MAIL_USERNAME');
            $mail->Password   = env('MAIL_PASSWORD');
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = (int) env('MAIL_PORT', 587);

            $mail->setFrom(env('MAIL_USERNAME'), env('MAIL_FROM_NAME', 'NoteApp'));
            $mail->addAddress($user->email, $user->display_name);

            $mail->isHTML(true);
            $mail->Subject = '=?UTF-8?B?' . base64_encode('Kích hoạt tài khoản NoteApp') . '?=';
            $mail->Body    = "Xin chào <b>{$user->display_name}</b>,<br><br>Vui lòng kích hoạt tài khoản bằng link sau:<br><a href='{$activationLink}'>{$activationLink}</a><br><br>Link có hiệu lực 24 giờ.";
            $mail->AltBody = "Xin chào {$user->display_name},\n\nVui lòng kích hoạt tài khoản bằng link sau:\n{$activationLink}\n\nLink có hiệu lực 24 giờ.";

            $mail->send();
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi hệ thống khi gửi lại email.',
                'debug_error' => $mail->ErrorInfo ?? $e->getMessage()
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã gửi lại email kích hoạt. Vui lòng kiểm tra hộp thư.',
        ]);
    }

    /**
     * Tiêu chí 4: Quên mật khẩu — gửi email reset
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['error' => 'Tài khoản không tồn tại'], 404);
        }

        $resetToken = Str::random(64);
        $user->update([
            'reset_token'  => $resetToken,
            'reset_expiry' => now()->addHour(),
        ]);

        $resetLink = env('FRONTEND_URL', 'http://localhost:5173')
            . '/reset-password?token=' . $resetToken;

            try {
                $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
                $mail->CharSet = 'UTF-8';
                $mail->isSMTP();
                $mail->Host       = env('MAIL_HOST', 'smtp.gmail.com');
                $mail->SMTPAuth   = true;
                $mail->Username   = env('MAIL_USERNAME');
                $mail->Password   = env('MAIL_PASSWORD');
                $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
                $mail->Port       = (int) env('MAIL_PORT', 587);

                // Gmail yêu cầu From phải trùng với Username đăng nhập
                $mail->setFrom(env('MAIL_USERNAME'), env('MAIL_FROM_NAME', 'NoteApp'));
                $mail->addAddress($user->email, $user->display_name);

                $mail->isHTML(true);
                $mail->Subject = '=?UTF-8?B?' . base64_encode('Đặt lại mật khẩu NoteApp') . '?=';
                $mail->Body    = "Xin chào <b>{$user->display_name}</b>,<br><br>Nhấn vào link sau để đặt lại mật khẩu của bạn:<br><a href='{$resetLink}'>{$resetLink}</a><br><br>Link có hiệu lực 1 giờ.";
                $mail->AltBody = "Nhấn vào link sau để đặt lại mật khẩu:\n{$resetLink}\n\nLink có hiệu lực 1 giờ.";

                $mail->send();
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lỗi hệ thống khi gửi email đặt lại mật khẩu.',
                    'debug_error' => $mail->ErrorInfo ?? $e->getMessage()
                ], 500);
            }

        return response()->json([
            'success' => true,
            'message' => 'Link đặt lại mật khẩu đã được gửi đến email của bạn.',
        ]);
    }

    /**
     * Tiêu chí 4: Đặt lại mật khẩu bằng token
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token'       => 'required|string',
            'newPassword' => 'required|string|min:6',
        ]);

        $user = User::where('reset_token', $request->token)->first();

        if (!$user) {
            return response()->json(['error' => 'Token không hợp lệ'], 400);
        }
        if ($user->reset_expiry && $user->reset_expiry->isPast()) {
            return response()->json(['error' => 'Token đã hết hạn'], 400);
        }

        $user->update([
            'password'     => Hash::make($request->newPassword),
            'reset_token'  => null,
            'reset_expiry' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đặt lại mật khẩu thành công!',
        ]);
    }

    /**
     * Tiêu chí 7: Đổi mật khẩu (đang đăng nhập)
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'currentPassword' => 'required|string',
            'newPassword'     => 'required|string|min:6',
        ]);

        $user = $request->user();

        if (!Hash::check($request->currentPassword, $user->password)) {
            return response()->json(['error' => 'Mật khẩu hiện tại không đúng'], 401);
        }

        $user->update(['password' => Hash::make($request->newPassword)]);

        return response()->json([
            'success' => true,
            'message' => 'Đổi mật khẩu thành công!',
        ]);
    }
}

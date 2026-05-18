<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Tiêu chí 5: Xem profile
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'user'    => [
                'id'           => $user->id,
                'email'        => $user->email,
                'username'     => $user->username,
                'display_name' => $user->display_name,
                'avatar'       => $user->avatar,
                'bio'          => $user->bio,
                'accent_color' => $user->accent_color,
                'is_active'    => $user->is_active,
                'preferences'  => $user->preferences,
                'created_at'   => $user->created_at,
            ],
        ]);
    }

    /**
     * Tiêu chí 6: Chỉnh sửa profile
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'display_name' => 'required|string|max:150',
            'bio'          => 'nullable|string|max:500',
            'avatar'       => 'nullable|string',
            'accent_color' => 'nullable|string|max:100',
        ]);

        $user = $request->user();
        $user->update($request->only(['display_name', 'bio', 'avatar', 'accent_color']));

        return response()->json([
            'success' => true,
            'user'    => $user->fresh()->makeHidden(['password', 'activation_token', 'reset_token']),
        ]);
    }

    /**
     * Tiêu chí 8: GET preferences
     * Feature 2.6: Extended with font_size, note_color, theme
     */
    public function preferences(Request $request): JsonResponse
    {
        $defaults = [
            'theme'                     => 'light',
            'font_size'                 => 'medium',   // small | medium | large
            'default_note_color'        => '#fef08a',
            'showVietnameseHolidays'    => true,
            'showInternationalHolidays' => true,
            'showLunarHolidays'         => true,
            'showTet'                   => true,
        ];

        $prefs = array_merge($defaults, $request->user()->preferences ?? []);

        return response()->json(['success' => true, 'preferences' => $prefs]);
    }

    /**
     * Tiêu chí 8: PUT preferences
     * Feature 2.6: Accepts font_size, default_note_color, theme
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $allowed = [
            'theme', 'font_size', 'default_note_color',
            'showVietnameseHolidays', 'showInternationalHolidays',
            'showLunarHolidays', 'showTet',
        ];

        $user    = $request->user();
        $current = $user->preferences ?? [];
        $merged  = array_merge($current, $request->only($allowed));

        $user->update(['preferences' => $merged]);

        return response()->json(['success' => true, 'preferences' => $merged]);
    }

    /**
     * Tiêu chí: Xóa tài khoản
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Delete all notes of user
        $user->notes()->delete();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tài khoản đã được xóa thành công.'
        ]);
    }
}

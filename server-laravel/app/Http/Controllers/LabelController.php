<?php

namespace App\Http\Controllers;

use App\Http\Requests\LabelRequest;
use App\Models\Label;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LabelController extends Controller
{
    /** Tiêu chí 15: List labels */
    public function index(Request $request): JsonResponse
    {
        $labels = $request->user()->labels()->orderBy('name')->get();
        return response()->json(['success' => true, 'labels' => $labels]);
    }

    /** Tiêu chí 19: Create label */
    public function store(LabelRequest $request): JsonResponse
    {
        $label = $request->user()->labels()->create([
            'name'  => $request->name,
            'color' => $request->input('color', '#6366f1'),
        ]);

        return response()->json(['success' => true, 'label' => $label], 201);
    }

    /** Tiêu chí 19: Update label */
    public function update(LabelRequest $request, Label $label): JsonResponse
    {
        if ($label->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Không có quyền'], 403);
        }

        $label->update($request->only(['name', 'color']));
        return response()->json(['success' => true, 'label' => $label]);
    }

    /** Tiêu chí 19: Delete label */
    public function destroy(Request $request, Label $label): JsonResponse
    {
        if ($label->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Không có quyền'], 403);
        }

        $label->delete();
        return response()->json(['success' => true]);
    }
}

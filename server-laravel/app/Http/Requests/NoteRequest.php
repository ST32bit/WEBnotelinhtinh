<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NoteRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title'      => 'required|string|max:255',
            'content'    => 'nullable|string',
            'label_ids'  => 'nullable|array',
            'label_ids.*'=> 'integer|exists:labels,id',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Tiêu đề là bắt buộc',
        ];
    }
}

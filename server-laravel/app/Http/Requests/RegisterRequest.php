<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    public function rules(): array
    {
        return [
            'email'           => 'required|email|unique:users,email',
            'username'        => 'required|string|min:3|max:100|unique:users,username',
            'displayName'     => 'required|string|max:150',
            'password'        => 'required|string|min:6',
            'confirmPassword' => 'required|same:password',
        ];
    }

    public function messages(): array
    {
        return [
            'email.required'         => 'Email là bắt buộc',
            'email.email'            => 'Email không hợp lệ',
            'email.unique'           => 'Email này đã được đăng ký',
            'username.required'      => 'Username là bắt buộc',
            'username.unique'        => 'Username đã tồn tại',
            'password.required'      => 'Mật khẩu là bắt buộc',
            'password.min'           => 'Mật khẩu phải có ít nhất 6 ký tự',
            'confirmPassword.same'   => 'Mật khẩu nhập lại không khớp',
        ];
    }
}

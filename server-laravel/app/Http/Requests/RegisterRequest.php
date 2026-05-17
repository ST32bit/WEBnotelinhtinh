<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $data = $this->all();

        if (empty($data)) {
            $json = json_decode($this->getContent(), true);
            if (is_array($json)) {
                $data = $json;
            }
        }

        if (empty($data['confirmPassword']) && !empty($data['password_confirmation'])) {
            $data['confirmPassword'] = $data['password_confirmation'];
        }

        if (empty($data['displayName']) && !empty($data['display_name'])) {
            $data['displayName'] = $data['display_name'];
        }

        if (empty($data['username']) && !empty($data['email'])) {
            $data['username'] = strstr($data['email'], '@', true) ?: $data['email'];
        }

        $this->replace($data);
    }
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    public function rules(): array
    {
        return [
            'email'           => 'required|email|unique:users,email',
            'username'        => 'sometimes|string|min:3|max:100|unique:users,username',
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
            'username.unique'        => 'Username đã tồn tại',
            'password.required'      => 'Mật khẩu là bắt buộc',
            'password.min'           => 'Mật khẩu phải có ít nhất 6 ký tự',
            'confirmPassword.same'   => 'Mật khẩu nhập lại không khớp',
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
class StoreTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

   public function rules(): array
    {
        return [
            'category_id' => [
                'required',
                Rule::exists('categories', 'id')->where(fn($q) => $q->where('user_id', Auth::id())),
            ],
            'amount'      => ['required','numeric','min:0.01'],
            'date'        => ['required','date'],
            'description' => ['nullable','string'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.required' => 'Wybierz kategorię.',
            'category_id.exists'   => 'Wybrana kategoria nie należy do Twojego konta.',
            'amount.min'           => 'Kwota musi być większa od zera.',
        ];
    }
}
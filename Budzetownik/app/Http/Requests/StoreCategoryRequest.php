<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;


class StoreCategoryRequest extends FormRequest
{

    public function authorize(): bool
    {
         return $this->user() !== null;
    }


    public function rules(): array
    {
        return [
            'name'  => ['required', 'string', 'max:100'],
            'type'  => ['required', 'in:income,expense'],
            'color' => ['nullable', 'regex:/^#(?:[A-Fa-f0-9]{3}){1,2}$/'],
        ];
    }
    public function messages(): array
    {
        return [
            'name.required' => 'Nazwa kategorii jest wymagana.',
            'type.in'       => 'Typ musi być income lub expense.',
            'color.regex'   => 'Kolor powinien być w formacie #RRGGBB.',
        ];
    }
}

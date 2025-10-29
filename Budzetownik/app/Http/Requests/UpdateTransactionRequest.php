<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class UpdateTransactionRequest extends FormRequest
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
                    Rule::exists('categories','id')->where(fn($q)=>$q->where('user_id', Auth::id())),
                ],
                'amount'      => ['required','numeric','min:0.01'],
                'date'        => ['required','date'],
                'description' => ['nullable','string'],
            ];
        }
}
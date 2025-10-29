<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankIntegration extends Model
{
    protected $fillable = [
        'user_id',
        'source',
        'owner',
        'api_key',
        'base_url',
        'access_token',
        'refresh_token',
        'webhook_id',
        'webhook_secret',
    ];
}

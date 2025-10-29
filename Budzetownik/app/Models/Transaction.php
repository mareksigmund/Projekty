<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    protected $fillable = [
        'user_id',
        'category_id',
        'amount',          // DECIMAL (stare pole — wypełnimy)
        'date',
        'description',
        // nowe / integracyjne:
        'account_id',
        'external_id',
        'external_source',
        'amount_minor',    // grosze
        'currency',
        'raw_payload',
        'synced_at',
    ];

    protected $casts = [
        'date'        => 'datetime',
        'amount'      => 'decimal:2',
        'raw_payload' => 'array',
        'synced_at'   => 'datetime',
    ];

    public function user()     { return $this->belongsTo(User::class); }
    public function category() { return $this->belongsTo(Category::class); }
    public function account()  { return $this->belongsTo(\App\Models\Account::class); }
}


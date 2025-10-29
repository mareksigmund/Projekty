<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    protected $fillable = ['user_id','name','currency','external_id','external_source'];

    public function user() { return $this->belongsTo(User::class); }
    public function transactions() { return $this->hasMany(Transaction::class); }
}

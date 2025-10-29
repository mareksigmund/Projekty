<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryRule extends Model
{
    protected $fillable = ['user_id','category_id','keywords','priority'];

    public function category() { return $this->belongsTo(Category::class); }
    public function user()     { return $this->belongsTo(User::class); }
}
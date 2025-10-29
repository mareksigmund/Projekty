<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('accounts', function (Illuminate\Database\Schema\Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('currency', 3)->default('PLN');
            $t->string('external_id')->index();               // MockBank accountId
            $t->string('external_source')->default('mockbank')->index();
            $t->timestamps();
            $t->unique(['user_id','external_id','external_source'], 'accounts_user_ext_unique');
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};

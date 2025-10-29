<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::table('transactions', function (Illuminate\Database\Schema\Blueprint $t) {
        if (!Schema::hasColumn('transactions','account_id')) {
            $t->foreignId('account_id')->nullable()->constrained('accounts')->nullOnDelete();
        }
        if (!Schema::hasColumn('transactions','external_id')) {
            $t->string('external_id')->nullable()->index();
        }
        if (!Schema::hasColumn('transactions','external_source')) {
            $t->string('external_source')->nullable()->index();
        }
        if (!Schema::hasColumn('transactions','amount_minor')) {
            $t->integer('amount_minor')->nullable(); // kwota w groszach
        }
        if (!Schema::hasColumn('transactions','currency')) {
            $t->string('currency',3)->nullable();
        }
        if (!Schema::hasColumn('transactions','raw_payload')) {
            $t->json('raw_payload')->nullable();
        }
        if (!Schema::hasColumn('transactions','synced_at')) {
            $t->timestamp('synced_at')->nullable();
        }
    });

    // unikalność dla idempotencji (jeśli kolumny istnieją)
    if (Schema::hasColumn('transactions','user_id') &&
        Schema::hasColumn('transactions','external_id') &&
        Schema::hasColumn('transactions','external_source')) {
        try {
            DB::statement('CREATE UNIQUE INDEX transactions_user_ext_unique ON transactions (user_id, external_id, external_source)');
        } catch (\Throwable $e) {
            // może już istnieć — ignorujemy
        }
    }
}

public function down(): void
{
    Schema::table('transactions', function (Illuminate\Database\Schema\Blueprint $t) {
        if (Schema::hasColumn('transactions','synced_at'))    $t->dropColumn('synced_at');
        if (Schema::hasColumn('transactions','raw_payload'))  $t->dropColumn('raw_payload');
        if (Schema::hasColumn('transactions','currency'))     $t->dropColumn('currency');
        if (Schema::hasColumn('transactions','amount_minor')) $t->dropColumn('amount_minor');
        if (Schema::hasColumn('transactions','external_source')) $t->dropColumn('external_source');
        if (Schema::hasColumn('transactions','external_id'))  $t->dropColumn('external_id');
        if (Schema::hasColumn('transactions','account_id'))   $t->dropConstrainedForeignId('account_id');
    });
    try {
        DB::statement('DROP INDEX transactions_user_ext_unique ON transactions');
    } catch (\Throwable $e) {}
}

};

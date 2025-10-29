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
        Schema::create('webhook_deliveries', function (Illuminate\Database\Schema\Blueprint $t) {
            $t->id();
            $t->string('source')->index();                 // 'mockbank'
            $t->string('idempotency_key')->index();       // X-MockBank-Idempotency-Key
            $t->timestamp('received_at')->useCurrent();
            $t->text('signature');
            $t->longText('request_body');
            $t->unique(['source','idempotency_key'], 'webhook_deliveries_src_key_unique');
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_deliveries');
    }
};

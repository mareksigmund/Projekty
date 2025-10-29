<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bank_integrations', function (Blueprint $table) {
            // Wymaga doctrine/dbal w niektórych obrazach; jeżeli brak – patrz uwaga poniżej.
            $table->text('access_token')->nullable()->change();
            $table->text('refresh_token')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('bank_integrations', function (Blueprint $table) {
            $table->text('access_token')->nullable(false)->change();
            $table->text('refresh_token')->nullable(false)->change();
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
public function up(): void
    {
        Schema::table('bank_integrations', function (Blueprint $table) {
            // Pola pod „pull z MockBank”
            if (!Schema::hasColumn('bank_integrations', 'owner')) {
                $table->string('owner', 255)->nullable()->after('source');
            }
            if (!Schema::hasColumn('bank_integrations', 'api_key')) {
                $table->string('api_key', 255)->nullable()->after('owner');
            }
            if (!Schema::hasColumn('bank_integrations', 'base_url')) {
                $table->string('base_url', 255)->nullable()->after('api_key');
            }

            // (Opcjonalnie) indeksy
            if (!Schema::hasColumn('bank_integrations', 'source')) {
                // W Twojej pierwszej migracji już jest 'source' z default i indexem – tu tylko awaryjnie
                $table->string('source', 32)->default('mockbank')->index()->change();
            }
        });
    }

    public function down(): void
    {
        Schema::table('bank_integrations', function (Blueprint $table) {
            // Drop columns tylko jeśli istnieją (gdybyś kiedyś rollbackował)
            if (Schema::hasColumn('bank_integrations', 'base_url')) {
                $table->dropColumn('base_url');
            }
            if (Schema::hasColumn('bank_integrations', 'api_key')) {
                $table->dropColumn('api_key');
            }
            if (Schema::hasColumn('bank_integrations', 'owner')) {
                $table->dropColumn('owner');
            }
        });
    }
};


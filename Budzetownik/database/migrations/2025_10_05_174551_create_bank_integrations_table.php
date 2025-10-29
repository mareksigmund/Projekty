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
    Schema::create('bank_integrations', function (Blueprint $table) {
        $table->id();

        // powiązanie z użytkownikiem (zakładam domyślne 'users' istnieje)
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();

        // źródło integracji (na razie tylko 'mockbank')
        $table->string('source', 32)->default('mockbank')->index();

        // tokeny (mogą być długie → TEXT jest bezpieczny)
        $table->text('access_token');
        $table->text('refresh_token')->nullable();

        // info o zarejestrowanym webhooku po stronie MockBank (opcjonalnie)
        $table->string('webhook_id', 64)->nullable();
        $table->string('webhook_secret', 128)->nullable();

        $table->timestamps();

        // unikalna integracja per użytkownik i źródło
        $table->unique(['user_id', 'source'], 'bank_integrations_user_source_unique');
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_integrations');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('category_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            // proste słowa-klucze, rozdzielane przecinkami (case-insensitive)
            $table->string('keywords'); // np. "wynagrodzenie, wypłata"
            $table->unsignedInteger('priority')->default(100); // mniejsze = ważniejsze
            $table->timestamps();

            $table->index(['user_id', 'priority']);
        });
    }

    public function down(): void {
        Schema::dropIfExists('category_rules');
    }
};

<?php

use App\Http\Controllers\BankWebhookController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MockBankIntegrationsController;
use App\Http\Controllers\MockBankSyncController;
use App\Http\Controllers\MockBankUiController;
use App\Http\Controllers\TransactionController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;

Route::get('/', fn() => redirect('/dashboard'));

Route::get('/dashboard',[DashboardController :: class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::resource('categories', CategoryController::class)->except(['show']);
    Route::resource('transactions', TransactionController::class);
    Route::post('/transactions/{transaction}/quick-category', [\App\Http\Controllers\TransactionController::class, 'quickCategory'])
    ->name('transactions.quickCategory');
});
Route::post('/api/bank/mockbank/webhook', [BankWebhookController::class, 'handle'])
    ->withoutMiddleware([VerifyCsrfToken::class]);
    
Route::get('/mockbank', [MockBankUiController::class, 'index'])->name('mockbank.index');
require __DIR__.'/auth.php';

Route::post('/mockbank/sync', [MockBankSyncController::class, 'sync'])->name('mockbank.sync');
Route::get('/mockbank/sync/status', [MockBankSyncController::class, 'status'])->name('mockbank.sync.status');

Route::middleware('auth')->group(function () {
    Route::get('/integrations/mockbank',  [MockBankIntegrationsController::class, 'create'])->name('integrations.mockbank.create');
    Route::post('/integrations/mockbank', [MockBankIntegrationsController::class, 'store'])->name('integrations.mockbank.store');
    Route::delete('/integrations/mockbank', [\App\Http\Controllers\MockBankIntegrationsController::class, 'destroy'])
        ->name('integrations.mockbank.destroy');
});

Route::get('/ping', fn () => 'pong');

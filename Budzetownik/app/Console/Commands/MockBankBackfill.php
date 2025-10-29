<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use App\Models\BankIntegration;
use App\Services\MockBankClient;
use App\Actions\UpsertMockBankTransaction;

class MockBankBackfill extends Command
{
    protected $signature = 'mockbank:backfill {--days=90} {--user=1} {--limit=100}';
    protected $description = 'Backfill last N days of transactions from MockBank for a user';

    public function handle(MockBankClient $client): int
    {
        $userId = (int) $this->option('user');
        $days   = (int) $this->option('days');
        $limit  = max(1, (int) $this->option('limit'));

        $bi = BankIntegration::where('user_id', $userId)->where('source', 'mockbank')->first();
        if (!$bi) {
            $this->error('No MockBank integration found for user. Run: php artisan mockbank:connect');
            return self::FAILURE;
        }

        $fromIso = now()->subDays($days)->startOfDay()->toISOString();
        $toIso   = now()->endOfDay()->toISOString();

        $created = 0; $updated = 0; $accIdx = 0;

        try {
            $accounts = $client->accounts($bi->access_token);
        } catch (\Throwable $e) {
            $this->error('Fetching accounts failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        foreach ($accounts as $acc) {
            $accIdx++;
            $accId    = (string)($acc['id'] ?? $acc['_id'] ?? '');
            $accName  = (string)($acc['name'] ?? 'Konto MockBank');
            $currency = (string)($acc['currency'] ?? 'PLN');
            if ($accId === '') {
                $this->warn("[$accIdx] Skipping account with empty id");
                continue;
            }

            $this->info("[$accIdx] Account {$accName} ({$accId}) — fetching…");

            $page = 1;
            while (true) {
                try {
                    $res = $client->transactions($bi->access_token, $accId, $fromIso, $toIso, $page, $limit);
                } catch (\Throwable $e) {
                    $this->warn("   page {$page} failed: " . $e->getMessage());
                    break;
                }

                $items = $res['items'] ?? [];
                $pages = (int)($res['pages'] ?? 1);

                if (empty($items)) {
                    $this->line("   page {$page}/{$pages}: 0 items");
                    break;
                }

                foreach ($items as $t) {
                    $model = UpsertMockBankTransaction::run($userId, $t, $accId, 'mockbank', $currency);
                    if ($model->wasRecentlyCreated) { $created++; } else { $updated++; }
                }

                $this->line("   page {$page}/{$pages}: processed " . count($items));
                if ($page >= $pages) break;
                $page++;

                // rate-limit safe
                usleep(120000); // 0.12s
            }

            usleep(200000); // 0.2s między kontami
        }

        $this->info("Done. created={$created}, updated={$updated}, range={$fromIso}..{$toIso}");
        Log::info('MockBank backfill summary', compact('created','updated','fromIso','toIso','userId'));

        return self::SUCCESS;
    }
}

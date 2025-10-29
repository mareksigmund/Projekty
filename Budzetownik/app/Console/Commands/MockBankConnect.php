<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BankIntegration;
use App\Services\MockBankClient;

class MockBankConnect extends Command
{
    protected $signature = 'mockbank:connect {--email=} {--password=} {--user=1}';
    protected $description = 'Log in to MockBank and store tokens for a user';

    public function handle(MockBankClient $client): int
    {
        $userId   = (int) $this->option('user');
        $email    = (string) ($this->option('email') ?? '');
        $password = (string) ($this->option('password') ?? '');

        if ($email === '')    { $email = (string) $this->ask('MockBank email'); }
        if ($password === '') { $password = (string) $this->secret('MockBank password'); }

        try {
            $res = $client->login($email, $password);
        } catch (\Throwable $e) {
            $this->error('Login failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        $access  = $res['accessToken']  ?? null;
        $refresh = $res['refreshToken'] ?? null;

        if (!$access) {
            $this->error('MockBank did not return accessToken');
            return self::FAILURE;
        }

        $bi = BankIntegration::updateOrCreate(
            ['user_id' => $userId, 'source' => 'mockbank'],
            [
                'access_token'  => $access,
                'refresh_token' => $refresh,
                'webhook_secret'=> config('services.mockbank.webhook_secret'),
            ]
        );

        $this->info("Connected: integration_id={$bi->id}");
        return self::SUCCESS;
    }
}

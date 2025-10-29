<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MockBankClient
{
    public function pullOwnerTransactions(
        string $apiKey,
        string $owner,
        ?string $from,
        ?string $to,
        ?string $baseUrl = null,
        int $timeout = 20
    ): array {
        $base   = rtrim($baseUrl ?: (string) config('services.mockbank.base_url', ''), '/');
        $ownerE = rawurlencode($owner);
        $url    = "{$base}/api/owner/{$ownerE}/transactions";

        $query = [];
        if ($from) $query['from'] = $from;
        if ($to)   $query['to']   = $to;

        Log::info('MOCKBANK PULL start', ['url' => $url, 'query' => $query, 'owner' => $owner]);

        $resp = Http::withHeaders([
                'Authorization' => 'Bearer '.$apiKey,
                'Accept'        => 'application/json',
            ])
            ->timeout($timeout)
            ->retry(2, 300)
            ->get($url, $query);

        if (!$resp->ok()) {
            Log::warning('MOCKBANK PULL non-200', ['status' => $resp->status(), 'body' => $resp->body()]);
            return ['items' => [], 'count' => 0, 'status' => $resp->status()];
        }

        $data  = $resp->json();
        $items = is_array($data['items'] ?? null) ? $data['items'] : [];

        Log::info('MOCKBANK PULL ok', ['count' => count($items)]);

        return [
            'items'  => $items,
            'count'  => (int) ($data['count'] ?? count($items)),
            'status' => $resp->status(),
        ];
    }
}
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\BankIntegration;
use App\Actions\UpsertMockBankTransaction;

class MockBankSyncController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * POST /mockbank/sync
     * Body:
     *  - days=1|7|90  (gdy brak "all")
     *  - all=1        (pełna historia; leci oknami po $stepDays)
     */
    public function sync(Request $request)
    {
        $user = $request->user();

        // --- konfiguracja "pełnej historii" ---
        $isAll    = $request->boolean('all');
        $maxYears = (int) config('services.mockbank.max_years', (int) env('MOCKBANK_MAX_YEARS', 5));
        $stepDays = (int) config('services.mockbank.step_days', 90); // okna 90-dniowe

        // --- zakres dat dla trybu "dni" (fallback) ---
        $days = max(1, (int) $request->input('days', 1));
        $to   = Carbon::now('UTC')->toDateString();
        $from = Carbon::now('UTC')->subDays($days - 1)->toDateString();

        // --- parametry integracji (DB -> fallback .env) ---
        $integration = BankIntegration::where('user_id', $user->id)
            ->where('source', 'mockbank')
            ->first();

        $owner   = $integration->owner   ?? env('MOCKBANK_OWNER');
        $apiKey  = $integration->api_key ?? env('MOCKBANK_API_KEY');
        $baseUrl = $integration->base_url ?: config('services.mockbank.base_url', env('MOCKBANK_BASE_URL'));

        if (empty($owner) || empty($apiKey) || empty($baseUrl)) {
            return back()->with('sync_error', 'Brak połączenia z MockBankiem. Uzupełnij owner/API key w integracji lub .env.');
        }

        Log::info('MOCKBANK SYNC start', [
            'uid'    => $user->id,
            'mode'   => $isAll ? 'all' : 'days',
            'owner'  => $owner,
            'from'   => $isAll ? null : $from,
            'to'     => $isAll ? null : $to,
            'years'  => $isAll ? $maxYears : null,
            'window' => $isAll ? $stepDays : null,
        ]);

        try {
            $createdTotal = 0;
            $updatedTotal = 0;
            $rangeInfo    = null;

            if ($isAll) {
                // Pełna historia: cofamy się maks. $maxYears lat, idąc oknami po $stepDays.
                $end   = Carbon::now('UTC')->endOfDay();
                $start = (clone $end)->subYears($maxYears)->startOfDay();

                $encodedOwner = rawurlencode($owner);
                $base = rtrim($baseUrl, '/') . "/api/owner/{$encodedOwner}/transactions";

                $cursorFrom = (clone $start);

                while ($cursorFrom->lte($end)) {
                    $cursorTo = (clone $cursorFrom)->addDays($stepDays - 1);
                    if ($cursorTo->gt($end)) {
                        $cursorTo = (clone $end);
                    }

                    $resp = Http::timeout((int) config('services.mockbank.timeout', 20))
                        ->withToken($apiKey)
                        ->get($base, [
                            'from' => $cursorFrom->toDateString(),
                            'to'   => $cursorTo->toDateString(),
                        ]);

                    if (!$resp->ok()) {
                        Log::warning('MOCKBANK SYNC non-200 (all)', [
                            'status' => $resp->status(),
                            'body'   => $resp->body(),
                            'from'   => $cursorFrom->toDateString(),
                            'to'     => $cursorTo->toDateString(),
                        ]);
                        return back()->with('sync_error', "MockBank zwrócił {$resp->status()} (od {$cursorFrom->toDateString()} do {$cursorTo->toDateString()}).");
                    }

                    $items = $resp->json('items', []);
                    foreach ($items as $it) {
                        $model = UpsertMockBankTransaction::run(
                            $user->id,
                            [
                                'externalTxnId' => $it['externalTxnId'] ?? ($it['id'] ?? null),
                                'amount'        => $it['amount'] ?? 0,
                                'currency'      => $it['currency'] ?? 'PLN',
                                'date'          => $it['date'] ?? null,
                                'description'   => $it['description'] ?? '',
                                'raw'           => $it['raw'] ?? null,
                            ],
                            (string) ($it['accountId'] ?? 'acc_unknown'),
                            'mockbank',
                            $it['currency'] ?? 'PLN'
                        );

                        if ($model->wasRecentlyCreated) {
                            $createdTotal++;
                        } else {
                            $updatedTotal++;
                        }
                    }

                    // następne okno
                    $cursorFrom->addDays($stepDays);
                    // lekka pauza, żeby nie „zalać” serwera
                    usleep(150 * 1000); // 150 ms
                }

                $rangeInfo = [
                    'from' => $start->toDateString(),
                    'to'   => $end->toDateString(),
                ];
            } else {
                // Zwykły tryb „X dni wstecz”
                $encodedOwner = rawurlencode($owner);
                $url = rtrim($baseUrl, '/') . "/api/owner/{$encodedOwner}/transactions";

                $resp = Http::timeout((int) config('services.mockbank.timeout', 20))
                    ->withToken($apiKey)
                    ->get($url, ['from' => $from, 'to' => $to]);

                if (!$resp->ok()) {
                    Log::warning('MOCKBANK SYNC non-200', [
                        'status' => $resp->status(),
                        'body'   => $resp->body(),
                    ]);
                    return back()->with('sync_error', "MockBank zwrócił {$resp->status()} – sprawdź klucz/owner/zakres.");
                }

                $items = $resp->json('items', []);
                foreach ($items as $it) {
                    $model = UpsertMockBankTransaction::run(
                        $user->id,
                        [
                            'externalTxnId' => $it['externalTxnId'] ?? ($it['id'] ?? null),
                            'amount'        => $it['amount'] ?? 0,
                            'currency'      => $it['currency'] ?? 'PLN',
                            'date'          => $it['date'] ?? null,
                            'description'   => $it['description'] ?? '',
                            'raw'           => $it['raw'] ?? null,
                        ],
                        (string) ($it['accountId'] ?? 'acc_unknown'),
                        'mockbank',
                        $it['currency'] ?? 'PLN'
                    );

                    if ($model->wasRecentlyCreated) {
                        $createdTotal++;
                    } else {
                        $updatedTotal++;
                    }
                }

                $rangeInfo = [
                    'from' => $from,
                    'to'   => $to,
                ];
            }

            $summary = [
                'created'     => $createdTotal,
                'updated'     => $updatedTotal,
                'days'        => $isAll ? null : $days,
                'finished_at' => now()->toDateTimeString(),
                'range'       => $rangeInfo,
                'mode'        => $isAll ? 'all' : 'days',
            ];

            Cache::put('mockbank:last_sync:' . $user->id, $summary, now()->addHours(6));

            return back()->with('sync_result', $summary);

        } catch (\Throwable $e) {
            Log::error('MOCKBANK SYNC exception', ['err' => $e->getMessage()]);
            return back()->with('sync_error', 'Błąd synchronizacji: ' . $e->getMessage());
        }
    }
}

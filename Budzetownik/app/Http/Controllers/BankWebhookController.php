<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Actions\UpsertMockBankTransaction;

class BankWebhookController extends Controller
{
    public function handle(Request $request)
    {
        Log::info('WEBHOOK v4: start');

        // A) Parsowanie body
        $raw = $request->getContent();
        $payload = json_decode($raw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::warning('WEBHOOK v4: JSON decode failed', [
                'err'    => json_last_error_msg(),
                'raw_md5'=> md5($raw),
                'len'    => strlen($raw),
            ]);
            $payload = $request->json()->all(); // fallback
        }
        if (!is_array($payload)) {
            $payload = [];
        }

        // B) Idempotencja (opcjonalnie)
        if ($key = $request->header('X-MockBank-Idempotency-Key')) {
            try {
                DB::table('webhook_deliveries')->insert([
                    'source'          => 'mockbank',
                    'idempotency_key' => $key,
                    'signature'       => (string) $request->header('X-MockBank-Signature'),
                    'request_body'    => $raw,
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                $msg = $e->getMessage();
                if (str_contains($msg, 'Duplicate') || str_contains($msg, '1062')) {
                    Log::info('WEBHOOK v4: duplicate idempotency key', ['key' => $key]);
                    return response()->noContent();
                }
                Log::warning('WEBHOOK v4: idempotency insert failed', ['err' => $msg]);
            }
        }

        // C) Kształt zdarzenia
        $eventType = $payload['type'] ?? null;
        $data      = $payload['data'] ?? null;

        // Fallback – pozwala wysłać „płaski” JSON bez wrappera {type,data}
        if (!$eventType && !$data && isset($payload['externalTxnId'])) {
            $eventType = 'transaction.created';
            $data = $payload;
        }

        if ($eventType !== 'transaction.created' || !is_array($data)) {
            Log::info('WEBHOOK v4: ignored type', [
                'type'     => $eventType,
                'has_data' => is_array($data),
            ]);
            return response()->noContent();
        }

        // D) Ekstrakcja pól
        $extTxnId   = (string)($data['externalTxnId'] ?? $data['id'] ?? '');
        $accountExt = (string)($data['accountId'] ?? '');
        $amountMn   = (int)   ($data['amount'] ?? 0);              // grosze
        $currency   = (string)($data['currency'] ?? 'PLN');
        $dateIso    = (string)($data['date'] ?? now()->toISOString());
        $desc       = (string)($data['description'] ?? '');

        if ($extTxnId === '' || $accountExt === '') {
            Log::warning('WEBHOOK v4: missing ids', compact('extTxnId','accountExt'));
            return response()->noContent();
        }

        // E) Właściciel transakcji (na razie z configu; docelowo: z bank_integrations)
        $userId = (int) config('services.mockbank.default_user_id', 1);

        // F) Upsert transakcji przez akcję
        try {
            $txn = UpsertMockBankTransaction::run(
                $userId,
                [
                    'externalTxnId' => $extTxnId,
                    'amount'        => $amountMn,
                    'currency'      => $currency,
                    'date'          => $dateIso,
                    'description'   => $desc,
                ],
                $accountExt,
                'mockbank',
                $currency
            );

            Log::info('WEBHOOK v4: upserted', [
                'txn_id'     => $txn->id,
                'user_id'    => $txn->user_id,
                'external_id'=> $txn->external_id,
                'amount_min' => $txn->amount_minor,
            ]);
        } catch (\Throwable $e) {
            Log::error('WEBHOOK v4: upsert failed', [
                'err' => $e->getMessage(),
            ]);
        }

        return response()->noContent();
    }
}

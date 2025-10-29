<?php

namespace App\Actions;

use App\Models\Transaction;
use App\Models\Account;
use App\Models\Category;
use Illuminate\Support\Carbon;
use App\Services\AutoCategorizer;

class UpsertMockBankTransaction
{
    /**
     * Upsert pojedynczej transakcji z MockBank.
     *
     * @param int         $userId
     * @param array       $txn             externalTxnId|id, amount (minor), currency, date, description, categoryHint?, accountId?
     * @param string      $accountExternal external id konta w MockBank
     * @param string      $source          'mockbank'
     * @param string|null $accountCurrency fallback waluty (PLN)
     */
    public static function run(
        int $userId,
        array $txn,
        string $accountExternal,
        string $source = 'mockbank',
        ?string $accountCurrency = 'PLN'
    ): Transaction {
        // 1) External Txn Id
        $extTxnId = (string) ($txn['externalTxnId']
            ?? $txn['external_txn_id']
            ?? $txn['id']
            ?? '');
        if ($extTxnId === '') {
            throw new \InvalidArgumentException('Missing externalTxnId');
        }

        // 2) Kwota (minor -> decimal)
        $amountMinor = (int) ($txn['amount'] ?? $txn['amount_minor'] ?? 0);
        $amountDec   = $amountMinor / 100;

        // 3) Waluta
        $currency = (string) ($txn['currency'] ?? $accountCurrency ?? 'PLN');

        // 4) Data (z ISO/UTC -> DATE)
        $dateRaw = (string) ($txn['date'] ?? $txn['bookingDate'] ?? now()->toISOString());
        try {
            $date = Carbon::parse($dateRaw)->toDateString(); // Y-m-d
        } catch (\Throwable $e) {
            $date = now()->toDateString();
        }

        // 5) Opis + hint
        $desc = (string) ($txn['description'] ?? $txn['title'] ?? '');
        $hint = (string) ($txn['categoryHint'] ?? '');

        // 6) Konto
        $account = Account::firstOrCreate(
            ['user_id' => $userId, 'external_id' => $accountExternal, 'external_source' => $source],
            ['name' => 'Konto MockBank', 'currency' => $currency]
        );

        // 7) Spróbuj odgadnąć kategorię (może utworzyć brakującą – tylko dla presetów/regels)
        $guessedCategoryId = AutoCategorizer::guess($userId, $desc, $hint, $amountMinor);

        // 8) Fallback + zgodność typu z kierunkiem kwoty
        $finalCategoryId = self::ensureCategoryMatchesAmount($userId, $guessedCategoryId, $amountMinor);

        // 9) UPSERT
        return Transaction::updateOrCreate(
            [
                'user_id'         => $userId,
                'external_id'     => $extTxnId,
                'external_source' => $source,
            ],
            [
                'account_id'   => $account->id,
                'category_id'  => $finalCategoryId,
                'date'         => $date,
                'description'  => $desc,
                'amount'       => $amountDec,     // DECIMAL
                'amount_minor' => $amountMinor,   // grosze
                'currency'     => $currency,
                'raw_payload'  => $txn,
                'synced_at'    => now(),
            ]
        );
    }

    /**
     * Zwraca category_id dobrane do kierunku kwoty.
     * - jeśli $guessedId == null -> tworzy "Nieprzypisane" dla właściwego typu
     * - jeśli typ kategorii nie zgadza się z kwotą -> dobiera bezpiecznik:
     *   > kwota >= 0  -> "Wypłata" (income)
     *   > kwota < 0   -> "Nieprzypisane" (expense)
     */
    private static function ensureCategoryMatchesAmount(int $userId, ?int $guessedId, int $amountMinor): int
    {
        $dir = $amountMinor < 0 ? 'expense' : 'income';

        // brak zgadniętej — użyj nieprzypisanej po stronie kierunku
        if (!$guessedId) {
            return self::findOrCreateCategory(
                $userId,
                'Nieprzypisane',
                $dir,
                '#607D8B'
            );
        }

        // mamy kategorię — sprawdź typ
        $cat = Category::find($guessedId);
        if (!$cat) {
            return self::findOrCreateCategory(
                $userId,
                'Nieprzypisane',
                $dir,
                '#607D8B'
            );
        }

        if ($cat->type === $dir) {
            return (int) $cat->id;
        }

        // typ nie pasuje — wybierz bezpiecznik po stronie kierunku
        if ($dir === 'income') {
            return self::findOrCreateCategory($userId, 'Wypłata', 'income', '#22c55e');
        }

        return self::findOrCreateCategory($userId, 'Nieprzypisane', 'expense', '#607D8B');
    }

    /** Znajdź/utwórz kategorię (helper lokalny). */
    private static function findOrCreateCategory(int $userId, string $name, string $type, string $color): int
    {
        $cat = Category::where('user_id', $userId)
            ->where('name', $name)
            ->where('type', $type)
            ->first();

        if (!$cat) {
            $cat = Category::create([
                'user_id' => $userId,
                'name'    => $name,
                'type'    => $type,
                'color'   => $color,
            ]);
        }

        return (int) $cat->id;
    }
}

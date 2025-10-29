<?php

namespace App\Services;

use App\Models\Category;
use App\Models\CategoryRule;

class AutoCategorizer
{
    /**
     * Zwraca ID kategorii (int) albo null.
     * Może tworzyć brakujące kategorie dla użytkownika (presety).
     *
     * Priorytet:
     *   1) reguły użytkownika (CategoryRule) — po keywords (CSV), priorytet rosnąco
     *   2) presety „bankowe” (regexy na marki/słowa kluczowe)
     *   3) null (fallback zrobi Upsert)
     */
    public static function guess(
        int $userId,
        ?string $description,
        ?string $hint = null,
        ?int $amountMinor = null
    ): ?int {
        $hayRaw = trim(($hint ? "$hint " : '') . ($description ?? ''));
        if ($hayRaw === '') {
            return null;
        }

        $hay = self::normalize($hayRaw);

        // 1) Reguły użytkownika
        $rules = CategoryRule::where('user_id', $userId)
            ->orderBy('priority')
            ->get(['category_id', 'keywords', 'priority']);

        foreach ($rules as $r) {
            foreach (explode(',', (string) $r->keywords) as $kw) {
                $kw = self::normalize($kw);
                if ($kw !== '' && mb_strpos($hay, $kw) !== false) {
                    return (int) $r->category_id;
                }
            }
        }

        // 2) Presety (tylko konkretne marki/słowa – bez ogólników typu „zakupy”).
        //    Każdy preset: jeśli dopasuje, upewniamy się że kategoria (name,type) istnieje.
        $presets = [
            // Jedzenie / zakupy spożywcze
            [
                'name'  => 'Jedzenie',
                'type'  => 'expense',
                'regex' => '/\b(biedronka|warzywniak|spozyw|spoż|market|zakupy spozywcze|zakupy spożywcze)\b/u',
                'color' => '#ef4444',
            ],
            // Kawa / kawiarnie
            [
                'name'  => 'Jedzenie',
                'type'  => 'expense',
                'regex' => '/\b(starbucks|kawa|kawiarnia)\b/u',
                'color' => '#ef4444',
            ],
            // Czynsz / mieszkanie
            [
                'name'  => 'Czynsz',
                'type'  => 'expense',
                'regex' => '/\b(czynsz|mieszkan|wspolnota|wspólnota)\b/u',
                'color' => '#f97316',
            ],
            // Transport — bilety/komunikacja
            [
                'name'  => 'Transport',
                'type'  => 'expense',
                'regex' => '/\b(bilet|komunikac|autobus|tramwaj|kolej|pkp|mpk)\b/u',
                'color' => '#3b82f6',
            ],
            // Wynagrodzenie / pensja / pracodawca
            [
                'name'  => 'Wypłata',
                'type'  => 'income',
                'regex' => '/\b(wynagrodzenie|pensja|payroll|acme)\b/u',
                'color' => '#22c55e',
            ],
            // Zwroty / przelewy od znajomych
            [
                'name'  => 'Zwroty',
                'type'  => 'income',
                'regex' => '/\b(zwrot|przelew od|refund)\b/u',
                'color' => '#16a34a',
            ],
        ];

        foreach ($presets as $p) {
            if (preg_match($p['regex'], $hay) === 1) {
                return self::findOrCreateCategory($userId, $p['name'], $p['type'], $p['color']);
            }
        }

        // 3) Nic nie złapało — oddaj null (Upsert zrobi „Nieprzypisane” wg kierunku kwoty)
        return null;
    }

    /** Normalizacja: lower, zdjęcie ogonków, zbicie spacji. */
    private static function normalize(string $s): string
    {
        $s = mb_strtolower($s);

        // polskie znaki -> ascii
        $map = [
            'ą'=>'a', 'ć'=>'c', 'ę'=>'e', 'ł'=>'l', 'ń'=>'n', 'ó'=>'o', 'ś'=>'s', 'ż'=>'z', 'ź'=>'z',
        ];
        $s = strtr($s, $map);

        // whitespace -> spacja
        $s = preg_replace('/\s+/u', ' ', $s);
        $s = trim($s);

        return $s;
    }

    /** Znajdź kategorię usera po (name,type) albo utwórz z kolorem. Zwraca ID. */
    private static function findOrCreateCategory(int $userId, string $name, string $type, ?string $color = null): int
    {
        $cat = Category::where('user_id', $userId)
            ->where('name', $name)
            ->where('type', $type)
            ->first();

        if ($cat) {
            // jeśli ktoś kiedyś zrobił tę nazwę w innym typie, zachowujemy zgodność typu:
            if ($cat->type !== $type) {
                $cat->type = $type;
                if (!$cat->color && $color) {
                    $cat->color = $color;
                }
                $cat->save();
            }
            return (int) $cat->id;
        }

        $cat = Category::create([
            'user_id' => $userId,
            'name'    => $name,
            'type'    => $type,   // 'income' | 'expense'
            'color'   => $color ?? '#607D8B',
        ]);

        return (int) $cat->id;
    }
}

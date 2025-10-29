<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Support\Facades\Hash;
class DemoSeeder extends Seeder
{

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
            // demo user
    $user = User::first() ?? User::create([
        'name' => 'Demo User',
        'email' => 'demo@example.com',
        'password' => Hash::make('password'),
    ]);
      // kategorie
    $income = Category::firstOrCreate([
        'user_id' => $user->id,
        'name'    => 'Wypłata',
        'type'    => 'income',
    ], ['color' => '#16a34a']);

    $food = Category::firstOrCreate([
        'user_id' => $user->id,
        'name'    => 'Jedzenie',
        'type'    => 'expense',
    ], ['color' => '#ef4444']);

    // transakcje
    Transaction::create([
        'user_id' => $user->id,
        'category_id' => $income->id,
        'amount' => 6500.00,
        'date' => now()->subDays(3),
        'description' => 'Wynagrodzenie lipiec',
    ]);

    Transaction::create([
        'user_id' => $user->id,
        'category_id' => $food->id,
        'amount' => 72.49,
        'date' => now()->subDay(),
        'description' => 'Zakupy – warzywniak',
    ]);

    // nowa kategoria Transport (expense)
$transport = Category::firstOrCreate([
    'user_id' => $user->id,
    'name'    => 'Transport',
    'type'    => 'expense',
], ['color' => '#0ea5e9']);

// przykładowa transakcja dla Transportu
Transaction::create([
    'user_id'     => $user->id,
    'category_id' => $transport->id,
    'amount'      => 5.40,
    'date'        => now(),
    'description' => 'Bilet autobusowy',
]);

}
}

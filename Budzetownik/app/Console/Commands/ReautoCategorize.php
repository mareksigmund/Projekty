<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Transaction;
use App\Services\AutoCategorizer;

class ReautoCategorize extends Command
{
    protected $signature = 'budzet:recategorize {--user=} {--only-uncategorized}';
    protected $description = 'Przypisz kategorie do istniejących transakcji na podstawie reguł.';

    public function handle(): int
    {
        $userId   = $this->option('user') ? (int)$this->option('user') : null;
        $onlyUncat = (bool)$this->option('only-uncategorized');

        $q = Transaction::query()->with('category');

        if ($userId) {
            $q->where('user_id', $userId);
        }
        if ($onlyUncat) {
            $q->whereHas('category', function($qq){
                $qq->where('name', 'Nieprzypisane');
            });
        }

        $count = $q->count();
        $bar = $this->output->createProgressBar($count);
        $bar->start();

        $updated = 0;

        $q->chunkById(500, function($chunk) use (&$updated, $bar) {
            foreach ($chunk as $t) {
                $catId = AutoCategorizer::guess($t->user_id, $t->description, null, (int)$t->amount_minor);
                if ($catId && $catId !== $t->category_id) {
                    $t->category_id = $catId;
                    $t->save();
                    $updated++;
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);
        $this->info("Zmieniono kategorii: $updated / $count");

        return Command::SUCCESS;
    }
}

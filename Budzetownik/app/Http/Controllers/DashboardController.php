<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function index(Request $request)
    {
        // 1) Miesiąc z query (?month=YYYY-MM), domyślnie bieżący
        $monthParam = $request->input('month', now()->format('Y-m'));

        try {
            $start = Carbon::createFromFormat('Y-m', $monthParam)->startOfMonth();
        } catch (\Exception $e) {
            $start = now()->startOfMonth();
            $monthParam = $start->format('Y-m');
        }
        $end = (clone $start)->endOfMonth();

        $userId = $request->user()->id;

        // 2) Sumy: przychody i wydatki w miesiącu
        $incomeSum = Transaction::where('user_id', $userId)
            ->whereBetween('date', [$start, $end])
            ->whereHas('category', fn($q) => $q->where('type', 'income'))
            ->sum('amount');

        $expenseSum = Transaction::where('user_id', $userId)
            ->whereBetween('date', [$start, $end])
            ->whereHas('category', fn($q) => $q->where('type', 'expense'))
            ->sum('amount');

        $balance = $incomeSum + $expenseSum;

        // 3) Ostatnie transakcje (5 najnowszych)
        $recent = Transaction::with('category')
            ->where('user_id', $userId)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        // 4) Breakdown wydatków wg kategorii (do wykresu)
        $expenseByCategory = Transaction::select('categories.name', 'categories.color')
            ->selectRaw('SUM(transactions.amount) as total')
            ->join('categories', 'categories.id', '=', 'transactions.category_id')
            ->where('transactions.user_id', $userId)
            ->whereBetween('transactions.date', [$start, $end])
            ->where('categories.type', 'expense')
            ->groupBy('transactions.category_id', 'categories.name', 'categories.color')
            ->orderByDesc('total')
            ->get()
            // awaryjnie brakujące/niepoprawne kolory
            ->map(function ($row) {
                $valid = is_string($row->color) && preg_match('/^#([A-Fa-f0-9]{3}){1,2}$/', $row->color);
                $row->color = $valid ? $row->color : '#9ca3af'; // neutralny szary
                return $row;
            });

        // Dane do wykresu
        $chartLabels = $expenseByCategory->pluck('name');
        $chartData   = $expenseByCategory->pluck('total');
        $chartColors = $expenseByCategory->pluck('color');

        // 4b) Breakdown PRZYCHODÓW wg kategorii (do wykresu #2)
        $incomeByCategory = Transaction::select('categories.name', 'categories.color')
            ->selectRaw('SUM(transactions.amount) as total')
            ->join('categories', 'categories.id', '=', 'transactions.category_id')
            ->where('transactions.user_id', $userId)
            ->whereBetween('transactions.date', [$start, $end])
            ->where('categories.type', 'income')
            ->groupBy('transactions.category_id', 'categories.name', 'categories.color')
            ->orderByDesc('total')
            ->get()
            ->map(function ($row) {
                $valid = is_string($row->color) && preg_match('/^#([A-Fa-f0-9]{3}){1,2}$/', $row->color);
                $row->color = $valid ? $row->color : '#60a5fa'; // domyślny niebieski
                return $row;
            });

        $incomeChartLabels = $incomeByCategory->pluck('name');
        $incomeChartData   = $incomeByCategory->pluck('total');
        $incomeChartColors = $incomeByCategory->pluck('color');

        // 5) Ostatnie 12 miesięcy: przychody vs wydatki
        $months = collect(range(11,0))->map(fn($i)=> now()->startOfMonth()->subMonths($i));
        $labels12 = $months->map(fn($m)=> $m->format('Y-m'));

        // pobierz sumy z jednego strzału, pogrupowane po YYYY-MM i typie
        $raw = Transaction::selectRaw("
                DATE_FORMAT(date, '%Y-%m') as ym,
                categories.type as type,
                SUM(transactions.amount) as total
            ")
            ->join('categories','categories.id','=','transactions.category_id')
            ->where('transactions.user_id',$userId)
            ->where('date','>=',$months->first()->toDateString())
            ->groupBy('ym','type')
            ->get()
            ->groupBy('ym');

        // zbuduj serie z zerami tam gdzie brak
        $income12  = [];
        $expense12 = [];
        foreach ($labels12 as $ym) {
            $g = $raw->get($ym, collect())->keyBy('type');
            $income12[]  = (float) optional($g->get('income'))->total ?? 0;
            $expense12[] = (float) optional($g->get('expense'))->total ?? 0;
        }


        return view('dashboard', [
            'month'       => $monthParam,
            'start'       => $start,
            'end'         => $end,
            'incomeSum'   => $incomeSum,
            'expenseSum'  => $expenseSum,
            'balance'     => $balance,
            'recent'      => $recent,
            'chartLabels' => $chartLabels,
            'chartData'   => $chartData,
            'chartColors' => $chartColors,
            'incomeChartLabels' => $incomeChartLabels,
            'incomeChartData'   => $incomeChartData,
            'incomeChartColors' => $incomeChartColors,
            'labels12'   => $labels12,
            'income12'   => $income12,
            'expense12'  => $expense12,
        ]);
    }
}

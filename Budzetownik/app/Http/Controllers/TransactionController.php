<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    // LISTA + filtry (miesiąc opcjonalny, kategoria, typ, kwoty, szukaj, sort)
    public function index(Request $request)
    {
        $user = $request->user();

        // 1) Walidacja parametrów GET
        $validated = $request->validate([
            'month'       => ['nullable','date_format:Y-m'],
            'category_id' => [
                'nullable',
                Rule::exists('categories','id')->where(fn($q)=>$q->where('user_id', $user->id)),
            ],
            'type'        => ['nullable','in:income,expense'],
            'min_amount'  => ['nullable','numeric','min:0','lte:max_amount'],
            'max_amount'  => ['nullable','numeric','min:0','gte:min_amount'],
            'q'           => ['nullable','string','max:100'],
            'sort'        => ['nullable','in:date_desc,date_asc,amount_desc,amount_asc'],
            'source'      => ['nullable','in:bank,manual'],
        ]);

        // 2) Miesiąc jest TYLKO opcjonalny – brak = wszystkie miesiące
        $month = $validated['month'] ?? null;
        $start = $end = null;
        if ($month) {
            try {
                $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
                $end   = (clone $start)->endOfMonth();
            } catch (\Throwable $e) {
                $month = null; // jeśli ktoś ręcznie wpisze zły format
            }
        }

        // 3) Zapytanie
        $query = $user->transactions()
            ->with(['category','account']); // account do wyświetlenia nazwy

        if ($start && $end) {
            $query->whereBetween('date', [$start, $end]);
        }

        if (!empty($validated['category_id'])) {
            $query->where('category_id', $validated['category_id']);
        }

        if (!empty($validated['type'])) {
            $query->whereHas('category', fn($q)=>$q->where('type', $validated['type']));
        }

        if (isset($validated['min_amount'])) {
            $query->where('amount', '>=', $validated['min_amount']);
        }
        if (isset($validated['max_amount'])) {
            $query->where('amount', '<=', $validated['max_amount']);
        }

        if (!empty($validated['q'])) {
            $q = $validated['q'];
            $query->where('description', 'like', "%{$q}%");
        }
        if (!empty($validated['source'])) {
    if ($validated['source'] === 'bank') {
        $query->where('external_source', 'mockbank');
    } else { // manual
        $query->where(function($qq){
            $qq->whereNull('external_source')->orWhere('external_source','');
        });
    }
}

        // 4) Sort
        $sort = $validated['sort'] ?? 'date_desc';
        switch ($sort) {
            case 'date_asc':
                $query->orderBy('date', 'asc')->orderBy('id', 'asc');
                break;
            case 'amount_desc':
                $query->orderBy('amount', 'desc')->orderBy('date', 'desc')->orderBy('id', 'desc');
                break;
            case 'amount_asc':
                $query->orderBy('amount', 'asc')->orderBy('date', 'desc')->orderBy('id', 'desc');
                break;
            case 'date_desc':
            default:
                $query->orderBy('date', 'desc')->orderBy('id', 'desc');
        }

        // 5) Paginacja
        $transactions = $query->paginate(10)->withQueryString();

        // Do selectów
        $categories = $user->categories()
            ->orderBy('type')->orderBy('name')
            ->get(['id','name','type','color']);

        // Filtry do widoku
        $filters = [
            'month'       => $month ?? '',      // puste = wszystkie
            'category_id' => $validated['category_id'] ?? '',
            'type'        => $validated['type'] ?? '',
            'min_amount'  => $validated['min_amount'] ?? '',
            'max_amount'  => $validated['max_amount'] ?? '',
            'q'           => $validated['q'] ?? '',
            'sort'        => $sort,
            'source'      => $validated['source'] ?? '',
        ];

        return view('transactions.index', compact(
            'transactions','categories','filters'
        ));
    }

    public function create(Request $request)
    {
        $categories = $request->user()->categories()
            ->orderBy('type')->orderBy('name')
            ->get(['id','name','type','color']);

        return view('transactions.create', compact('categories'));
    }

    public function store(StoreTransactionRequest $request)
    {
        $request->user()->transactions()->create([
            'category_id' => $request->input('category_id'),
            'amount'      => $request->input('amount'),
            'date'        => $request->input('date'),
            'description' => $request->input('description'),
        ]);

        return redirect()->route('transactions.index')
            ->with('success', 'Transakcja została dodana.');
    }

    public function edit(Request $request, $id)
    {
        $transaction = $request->user()->transactions()->with('category','account')->findOrFail($id);
        $categories = $request->user()->categories()
            ->orderBy('type')->orderBy('name')
            ->get(['id','name','type','color']);

        return view('transactions.edit', compact('transaction','categories'));
    }

    public function update(UpdateTransactionRequest $request, $id)
    {
        $transaction = $request->user()->transactions()->findOrFail($id);

        $transaction->update([
            'category_id' => $request->input('category_id'),
            'amount'      => $request->input('amount'),
            'date'        => $request->input('date'),
            'description' => $request->input('description'),
        ]);

        return redirect()->route('transactions.index')
            ->with('success', 'Transakcja została zaktualizowana.');
    }

    public function destroy(Request $request, $id)
    {
        $transaction = $request->user()->transactions()->findOrFail($id);
        $transaction->delete();

        return redirect()->route('transactions.index')
            ->with('success', 'Transakcja została usunięta.');
    }

    public function quickCategory(Request $request, \App\Models\Transaction $transaction)
    {
        $request->validate([
            'category_id' => [
                'required',
                Rule::exists('categories','id')->where(fn($q)=>$q->where('user_id', $request->user()->id)),
            ],
        ]);

        if ($transaction->user_id !== $request->user()->id) {
            abort(403);
        }

        $transaction->update(['category_id' => $request->input('category_id')]);

        return back()->with('success', 'Kategoria zaktualizowana.');
    }

}

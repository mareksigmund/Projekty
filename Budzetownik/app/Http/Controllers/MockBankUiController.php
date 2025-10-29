<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaction;

class MockBankUiController extends Controller
{
public function index(Request $request)
{
    $uid = $request->user()->id;

    $txns = \App\Models\Transaction::where('user_id', $uid)
        ->where('external_source', 'mockbank')
        ->orderByDesc('date')
        ->limit(50)
        ->get();

    $sumIn  = $txns->sum(fn($t) => max(0, (int)($t->amount_minor ?? 0)));
    $sumOut = $txns->sum(fn($t) => min(0, (int)($t->amount_minor ?? 0)));

    return view('mockbank.index', compact('txns','sumIn','sumOut'));
}
}

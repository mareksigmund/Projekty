<?php
namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\BankIntegration;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class MockBankIntegrationsController extends Controller
{
    public function __construct() { $this->middleware('auth'); }

    public function create(Request $request)
    {
        $integration = BankIntegration::where('user_id', $request->user()->id)
            ->where('source','mockbank')
            ->first();

        $envHasKey = filled(env('MOCKBANK_API_KEY'));
        $envBase   = config('services.mockbank.base_url', env('MOCKBANK_BASE_URL'));

        return view('integrations.mockbank', compact('integration','envHasKey','envBase'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'owner'    => ['required','string','max:200'],
            'api_key'  => ['nullable','string','max:200'],
            'base_url' => ['nullable','url','max:200'],
        ]);

        $apiKey  = $data['api_key'] ?: env('MOCKBANK_API_KEY');
        $baseUrl = $data['base_url'] ?: null;

        // jeżeli ktoś poda pusty base_url — zróbmy null
        if (!filled($baseUrl)) {
            $baseUrl = null;
        }

        BankIntegration::updateOrCreate(
            ['user_id' => $request->user()->id, 'source' => 'mockbank'],
            [
                'owner'          => $data['owner'],
                'api_key'        => $apiKey,
                'base_url'       => $baseUrl,
                'access_token'   => null,
                'refresh_token'  => null,
                'webhook_id'     => null,
                'webhook_secret' => null,
            ]
        );

        // po zapisie poproś Dashboard, by odpalił pełną synchronizację
        return redirect()
            ->route('dashboard')
            ->with('success', 'Połączono z MockBank.')
            ->with('do_sync_all', true);
    }
public function destroy(Request $request)
    {
        $user = $request->user();

        $summary = DB::transaction(function () use ($user) {
            $deletedTx = Transaction::where('user_id', $user->id)
                ->where('external_source', 'mockbank')
                ->delete();

            $deletedAcc = Account::where('user_id', $user->id)
                ->where('external_source', 'mockbank')
                ->delete();

            $deletedInt = BankIntegration::where('user_id', $user->id)
                ->where('source', 'mockbank')
                ->delete();

            // czyść „ostatnią synchronizację” z kafla
            Cache::forget('mockbank:last_sync:' . $user->id);

            return [
                'tx'  => $deletedTx,
                'acc' => $deletedAcc,
                'int' => $deletedInt,
            ];
        });

        return redirect()
            ->route('dashboard')
            ->with('success', "Odłączono MockBank. Usunięto transakcji: {$summary['tx']}, kont: {$summary['acc']}.");
    }
}
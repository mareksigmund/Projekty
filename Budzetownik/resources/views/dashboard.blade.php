<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between gap-3 flex-wrap">
            <h2 class="font-semibold text-xl">Dashboard</h2>

            <div class="flex items-center gap-3">
                @php
                    $uid = auth()->id();

                    // Czy użytkownik ma integrację w DB?
                    $hasIntegration = \App\Models\BankIntegration::where('user_id', $uid)
                        ->where('source', 'mockbank')
                        ->exists();

                    // Czy mamy fallback z .env (na dev)?
                    $envOwner = env('MOCKBANK_OWNER');
                    $envKey   = env('MOCKBANK_API_KEY');

                    // Czy możemy realnie zsynchronizować?
                    $canSync = $hasIntegration || ($envOwner && $envKey);
                @endphp

                @if ($canSync)
                    <form action="{{ route('mockbank.sync') }}" method="POST"
                          onsubmit="const b=this.querySelector('button'); b.disabled=true; b.dataset.old=b.innerHTML; b.innerHTML='Synchronizuję…';">
                        @csrf
                        <input type="hidden" name="days" value="1">
                        <button type="submit"  class="px-3 py-2 bg-emerald-600 text-white rounded opacity-50 cursor-not-allowed">
                            Połączono z bankiem
                        </button>
                    </form>

                    <form action="{{ route('integrations.mockbank.destroy') }}" method="POST"
      onsubmit="return confirm('Odłączyć MockBank i USUNĄĆ wszystkie transakcje z banku? Tego nie da się cofnąć.');">
    @csrf
    @method('DELETE')
    <button type="submit" class="px-3 py-2 border rounded text-rose-700 hover:bg-rose-50">
        ❌ Odłącz MockBank
    </button>
</form>

                @else
                    <a href="{{ route('integrations.mockbank.create') }}"
                       class="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded">
                        Połącz z MockBank →
                    </a>
                @endif

                {{-- Selektor miesiąca (YYYY-MM) --}}
                <form method="GET" action="{{ route('dashboard') }}" class="flex items-center gap-2">
                    <input type="month" name="month" value="{{ $month }}" class="border rounded p-2">
                    <button class="px-3 py-2 bg-indigo-600 text-white rounded">Pokaż</button>
                </form>
            </div>
        </div>
    </x-slot>

    {{-- FLASH: wynik synchronizacji / błąd --}}
    @if (session('sync_result'))
        @php $r = session('sync_result'); @endphp
        <div class="max-w-6xl mx-auto mt-4 px-4 py-3 rounded bg-emerald-50 text-emerald-800">
            Zsynchronizowano: <strong>+{{ $r['created'] }}</strong> / ~{{ $r['updated'] }}
            (zakres: {{ $r['days'] }} dni) • {{ $r['finished_at'] }}
            @isset($r['range'])
                <span class="text-gray-500">[{{ $r['range']['from'] }} → {{ $r['range']['to'] }}]</span>
            @endisset
        </div>
    @endif
    @if (session('sync_error'))
        <div class="max-w-6xl mx-auto mt-4 px-4 py-3 rounded bg-rose-50 text-rose-800">
            {{ session('sync_error') }}
        </div>
    @endif

    <div class="py-6 max-w-6xl mx-auto space-y-6">

        {{-- KAFEL MOCKBANK: ostatnia synchronizacja + szybkie przyciski --}}
<div class="bg-white rounded-2xl shadow p-5">
    <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
            <div class="text-lg font-semibold">MockBank</div>
            @php
                $uid  = \Illuminate\Support\Facades\Auth::id();
                $last = $uid ? \Illuminate\Support\Facades\Cache::get('mockbank:last_sync:' . $uid) : null;

                // CanSync (jak miałeś wcześniej)
                $hasIntegration = \App\Models\BankIntegration::where('user_id', $uid)
                    ->where('source', 'mockbank')->exists();
                $envOwner = env('MOCKBANK_OWNER');
                $envKey   = env('MOCKBANK_API_KEY');
                $canSync  = $hasIntegration || ($envOwner && $envKey);
            @endphp
            <div class="text-sm text-gray-500">
                Ostatnia synchronizacja:
                @if($last)
                    {{ \Carbon\Carbon::parse($last['finished_at'])->diffForHumans() }}
                    ( +{{ $last['created'] }} / ~{{ $last['updated'] }} )
                    @isset($last['range'])
                        <span class="text-gray-400">[{{ $last['range']['from'] }} → {{ $last['range']['to'] }}]</span>
                    @endisset
                @else
                    brak
                @endif
            </div>
        </div>

        <div class="flex items-center gap-2">
            @if ($canSync)
                {{-- teraz / 7 / 90 dni --}}
                <form action="{{ route('mockbank.sync') }}" method="POST"
                      onsubmit="const b=this.querySelector('button'); b.disabled=true; b.innerHTML='Synchronizuję…';">
                    @csrf
                    <input type="hidden" name="days" value="1">
                    <button type="submit" class="px-3 py-2 border rounded">
                        1 Dzeiń
                    </button>
                </form>

                <form action="{{ route('mockbank.sync') }}" method="POST"
                      onsubmit="const b=this.querySelector('button'); b.disabled=true; b.innerHTML='…';">
                    @csrf
                    <input type="hidden" name="days" value="7">
                    <button type="submit" class="px-3 py-2 border rounded ">7 dni</button>
                </form>

                <form action="{{ route('mockbank.sync') }}" method="POST"
                      onsubmit="const b=this.querySelector('button'); b.disabled=true; b.innerHTML='…';">
                    @csrf
                    <input type="hidden" name="days" value="90">
                    <button type="submit" class="px-3 py-2 border rounded">90 dni</button>
                </form>

                {{-- NOWOŚĆ: pełna historia --}}
                <form action="{{ route('mockbank.sync') }}" method="POST"
                      onsubmit="const b=this.querySelector('button'); b.disabled=true; b.innerHTML='Synchronizuję…';">
                    @csrf
                    <input type="hidden" name="all" value="1">
                    <button type="submit" class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded">
                        Synchronizuj wszystko
                    </button>
                </form>
            @else
                <a href="{{ route('integrations.mockbank.create') }}" class="px-3 py-2 border rounded">
                    Skonfiguruj integrację →
                </a>
            @endif
        </div>
    </div>

    {{-- AUTO-START pełnej synchronizacji po zapisie integracji --}}
    @if (session('do_sync_all') && $canSync)
        <form id="autoSyncAllForm" action="{{ route('mockbank.sync') }}" method="POST" class="hidden">
            @csrf
            <input type="hidden" name="all" value="1">
        </form>
        <script>
            // odpal po krótkiej chwili, żeby UI zdążył się wyrenderować
            setTimeout(() => {
                const f = document.getElementById('autoSyncAllForm');
                if (f) f.submit();
            }, 400);
        </script>
    @endif
</div>


<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    {{-- Przychody --}}
    <div class="bg-white rounded-2xl shadow p-5">
        <div class="text-sm text-gray-500">Przychody ({{ $start->format('M Y') }})</div>
        <div class="text-2xl font-semibold mt-1 text-green-600">
            {{ number_format($incomeSum, 2, ',', ' ') }} zł
        </div>
    </div>

    {{-- Wydatki --}}
    <div class="bg-white rounded-2xl shadow p-5">
        <div class="text-sm text-gray-500">Wydatki ({{ $start->format('M Y') }})</div>
        <div class="text-2xl font-semibold mt-1 text-red-600">
            -{{ number_format(abs($expenseSum), 2, ',', ' ') }} zł
        </div>
    </div>

    {{-- Bilans --}}
    <div class="bg-white rounded-2xl shadow p-5">
        <div class="text-sm text-gray-500">Bilans</div>
        <div class="text-2xl font-semibold mt-1 {{ $balance >= 0 ? 'text-green-600' : 'text-red-600' }}">
            {{ number_format($balance, 2, ',', ' ') }} zł
        </div>
    </div>
</div>


        {{-- Ostatnie transakcje --}}
        <div class="bg-white rounded-2xl shadow p-5">
            <div class="flex items-center justify-between mb-3">
                <div class="font-semibold">Ostatnie transakcje</div>
                <a href="{{ route('transactions.index') }}" class="px-3 py-1.5 border rounded text-sm">
                    Więcej transakcji
                </a>
            </div>

            <table class="min-w-full table-fixed">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left p-3 w-28">Data</th>
                        <th class="text-left p-3 w-48">Kategoria</th>
                        <th class="text-right p-3 w-36">Kwota</th>
                        <th class="text-left p-3">Opis</th>
                    </tr>
                </thead>
                <tbody>
                @forelse($recent as $t)
                    <tr class="border-t">
                        <td class="p-3 whitespace-nowrap">
                            {{ \Illuminate\Support\Carbon::parse($t->date)->format('Y-m-d') }}
                        </td>
                        <td class="p-3 whitespace-nowrap">
                            {{ $t->category?->name ?? '—' }}
                        </td>
                        <td class="p-3 text-right whitespace-nowrap
                            {{ $t->category && $t->category->type==='income' ? 'text-green-600' : 'text-red-600' }}">
                            {{ number_format($t->amount, 2, ',', ' ') }} zł
                        </td>
                        <td class="p-3 truncate">
                            <span class="block max-w-full overflow-hidden text-ellipsis">
                                {{ $t->description ?? '—' }}
                            </span>
                        </td>
                    </tr>
                @empty
                    <tr class="border-t">
                        <td colspan="4" class="p-6 text-center text-gray-500">Brak transakcji.</td>
                    </tr>
                @endforelse
                </tbody>
            </table>
        </div>

        {{-- Wykresy --}}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-2xl shadow p-5">
                <div class="font-semibold mb-3">Wydatki wg kategorii</div>
                <canvas id="expenseChart"></canvas>
                @if($chartData->isEmpty())
                    <div class="text-sm text-gray-500 mt-3">Brak danych w tym miesiącu.</div>
                @endif
            </div>

            <div class="bg-white rounded-2xl shadow p-5">
                <div class="font-semibold mb-3">Przychody wg kategorii</div>
                <canvas id="incomeChart"></canvas>
                @if(isset($incomeChartData) && collect($incomeChartData)->isEmpty())
                    <div class="text-sm text-gray-500 mt-3">Brak danych w tym miesiącu.</div>
                @endif
            </div>
        </div>

        @isset($labels12)
        <div class="bg-white rounded-2xl shadow p-5">
            <div class="font-semibold mb-3">Ostatnie 12 miesięcy — przychody vs wydatki</div>
            <canvas id="monthlyChart"></canvas>
        </div>
        @endisset
    </div>

    {{-- Chart.js --}}
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        (function(){
            const expLabels = @json($chartLabels);
            const expData   = @json($chartData);
            const expColors = @json($chartColors);
            if (expLabels && expLabels.length) {
                const ctxE = document.getElementById('expenseChart').getContext('2d');
                new Chart(ctxE, {
                    type: 'doughnut',
                    data: { labels: expLabels, datasets: [{ data: expData, backgroundColor: expColors }] },
                    options: { plugins: { legend: { position: 'bottom' } } }
                });
            }

            const incLabels = @json($incomeChartLabels ?? []);
            const incData   = @json($incomeChartData ?? []);
            const incColors = @json($incomeChartColors ?? []);
            if (incLabels && incLabels.length) {
                const ctxI = document.getElementById('incomeChart').getContext('2d');
                new Chart(ctxI, {
                    type: 'doughnut',
                    data: { labels: incLabels, datasets: [{ data: incData, backgroundColor: incColors }] },
                    options: { plugins: { legend: { position: 'bottom' } } }
                });
            }

            const labels12  = @json($labels12 ?? []);
            const income12  = @json($income12 ?? []);
            const expense12 = @json($expense12 ?? []);
            if (labels12 && labels12.length) {
                const ctxM = document.getElementById('monthlyChart').getContext('2d');
                new Chart(ctxM, {
                    type: 'bar',
                    data: { labels: labels12, datasets: [
                        { label: 'Przychody', data: income12 },
                        { label: 'Wydatki',   data: expense12 },
                    ]},
                    options: {
                        responsive: true,
                        plugins: { legend: { position: 'bottom' } },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { callback: v => v.toLocaleString('pl-PL') + ' zł' }
                            }
                        }
                    }
                });
            }
        })();
    </script>
</x-app-layout>

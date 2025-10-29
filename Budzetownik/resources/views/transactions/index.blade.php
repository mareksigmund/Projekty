<x-app-layout>
    <x-slot name="header">
        <div class="flex items-center justify-between">
            <h2 class="font-semibold text-xl">Transakcje</h2>
            <a href="{{ route('transactions.create') }}" class="px-4 py-2 bg-indigo-600 text-white rounded">
                + Dodaj transakcję
            </a>
        </div>
    </x-slot>

    <div class="py-6 max-w-6xl mx-auto">

        @if (session('success'))
            <div class="mb-4 p-3 bg-green-100 border border-green-200 rounded">
                {{ session('success') }}
            </div>
        @endif

        {{-- Filtry --}}
        <form method="GET" class="mb-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
            {{-- Miesiąc (puste = wszystkie) --}}
            <div>
                <label class="block text-sm mb-1">Miesiąc
                    <span class="text-xs text-gray-400 font-normal">(puste = wszystkie)</span>
                </label>
                <input type="month" name="month" value="{{ $filters['month'] }}" class="border rounded p-2 w-full">
            </div>

            {{-- Kategoria --}}
            <div>
                <label class="block text-sm mb-1">Kategoria</label>
                <select name="category_id" class="border rounded p-2 w-full">
                    <option value="">— wszystkie —</option>
                    @foreach($categories as $c)
                        <option value="{{ $c->id }}" @selected($filters['category_id']==$c->id)>
                            {{ $c->name }} ({{ $c->type==='income' ? 'przychód' : 'wydatek' }})
                        </option>
                    @endforeach
                </select>
            </div>

            {{-- Typ --}}
            <div>
                <label class="block text-sm mb-1">Typ</label>
                <select name="type" class="border rounded p-2 w-full">
                    <option value="">— oba —</option>
                    <option value="income"  @selected($filters['type']==='income')>Przychód</option>
                    <option value="expense" @selected($filters['type']==='expense')>Wydatek</option>
                </select>
            </div>

            {{-- Źródło --}}
            <div>
                <label class="block text-sm mb-1">Źródło</label>
                <select name="source" class="border rounded p-2 w-full">
                    <option value=""        @selected(($filters['source'] ?? '')==='')>Wszystkie</option>
                    <option value="bank"    @selected(($filters['source'] ?? '')==='bank')>Bank</option>
                    <option value="manual"  @selected(($filters['source'] ?? '')==='manual')>Ręczne</option>
                </select>
            </div>

            {{-- Kwota od --}}
            <div>
                <label class="block text-sm mb-1">Kwota od</label>
                <input type="number" step="0.01" name="min_amount" value="{{ $filters['min_amount'] }}" class="border rounded p-2 w-full">
            </div>

            {{-- Kwota do --}}
            <div>
                <label class="block text-sm mb-1">Kwota do</label>
                <input type="number" step="0.01" name="max_amount" value="{{ $filters['max_amount'] }}" class="border rounded p-2 w-full">
            </div>

            {{-- Sortowanie --}}
            <div>
                <label class="block text-sm mb-1">Sortuj</label>
                <select name="sort" class="border rounded p-2 w-full">
                    <option value="date_desc"   @selected($filters['sort']==='date_desc')>Data ↓ (najnowsze)</option>
                    <option value="date_asc"    @selected($filters['sort']==='date_asc')>Data ↑ (najstarsze)</option>
                    <option value="amount_desc" @selected($filters['sort']==='amount_desc')>Kwota ↓ (największe)</option>
                    <option value="amount_asc"  @selected($filters['sort']==='amount_asc')>Kwota ↑ (najmniejsze)</option>
                </select>
            </div>

            {{-- Szukaj w opisie (cała szerokość w drugim rzędzie) --}}
            <div class="lg:col-span-5">
                <label class="block text-sm mb-1">Szukaj w opisie</label>
                <input type="text" name="q" value="{{ $filters['q'] }}" class="border rounded p-2 w-full" placeholder="np. 'bilet', 'abonament'">
            </div>

            {{-- Akcje --}}
            <div class="flex gap-2 lg:col-span-2">
                <button class="px-3 py-2 bg-indigo-600 text-white rounded w-full">Filtruj</button>
                <a href="{{ route('transactions.index') }}" class="px-3 py-2 border rounded w-full text-center">Wyczyść</a>
            </div>
        </form>

        {{-- Tabela --}}
        <div class="bg-white rounded shadow overflow-x-auto">
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left p-3">Data</th>
                        <th class="text-left p-3">Kategoria</th>
                        <th class="text-right p-3">Kwota</th>
                        <th class="text-left p-3">Opis</th>
                        <th class="p-3 text-right">Akcje</th>
                    </tr>
                </thead>
                <tbody>
                @forelse ($transactions as $t)
                    @php
                        $isBank = ($t->external_source === 'mockbank');
                        $badgeText = $isBank ? 'Bank' : 'Ręczne';
                        $badgeClasses = $isBank
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200';
                        $accountName = trim($t->account->name ?? '');
                    @endphp
                    <tr class="border-t align-top">
                        <td class="p-3 whitespace-nowrap">
                            {{ \Illuminate\Support\Carbon::parse($t->date)->format('Y-m-d') }}
                        </td>

                        {{-- Kategoria + szybka zmiana --}}
                        <td class="p-3">
                            <div class="flex items-center gap-2">
                                @if($t->category?->color)
                                    <span class="inline-block w-4 h-4 rounded border" style="background: {{ $t->category->color }}"></span>
                                @endif
                                <span class="text-sm">{{ $t->category?->name ?? '—' }}</span>

                                <form action="{{ route('transactions.quickCategory', $t) }}" method="POST" class="ml-2">
                                    @csrf
                                    <select name="category_id" class="border rounded text-xs p-1"
                                            onchange="this.form.submit()">
                                        <option value="">— wybierz —</option>
                                        @foreach($categories as $c)
                                            <option value="{{ $c->id }}" @selected($t->category_id == $c->id)>
                                                {{ $c->name }} ({{ $c->type==='income' ? 'P' : 'W' }})
                                            </option>
                                        @endforeach
                                    </select>
                                </form>
                            </div>
                        </td>

                        {{-- Kwota --}}
                        <td class="p-3 text-right whitespace-nowrap
                            {{ ($t->category && $t->category->type==='income') ? 'text-green-600' : 'text-red-600' }}">
                            {{ number_format($t->amount, 2, ',', ' ') }} zł
                        </td>

                        {{-- Opis + badge --}}
                        <td class="p-3">
                            <div class="flex items-center gap-2">
                                <span class="truncate max-w-[28rem]">{{ $t->description ?? '—' }}</span>
                                <span class="text-xs px-2 py-0.5 border rounded {{ $badgeClasses }}">{{ $badgeText }}</span>
                                @if($isBank && $accountName !== '')
                                    <span class="text-xs px-2 py-0.5 border rounded bg-sky-50 text-sky-700 border-sky-200">
                                        {{ $accountName }}
                                    </span>
                                @endif
                            </div>
                        </td>

                        {{-- Akcje --}}
                        <td class="p-3 text-right whitespace-nowrap">
                            <a href="{{ route('transactions.edit', $t) }}" class="px-3 py-1 border rounded mr-2">Edytuj</a>
                            <form action="{{ route('transactions.destroy', $t) }}" method="POST" class="inline"
                                  onsubmit="return confirm('Usunąć tę transakcję?');">
                                @csrf @method('DELETE')
                                <button class="px-3 py-1 border rounded text-red-700">Usuń</button>
                            </form>
                        </td>
                    </tr>
                @empty
                    <tr class="border-t">
                        <td colspan="5" class="p-6 text-center text-gray-500">
                            Brak transakcji.
                        </td>
                    </tr>
                @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-4">
            {{ $transactions->links() }}
        </div>
    </div>
</x-app-layout>

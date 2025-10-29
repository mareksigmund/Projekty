<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl">Edytuj transakcję</h2>
    </x-slot>

    <div class="py-6 max-w-xl mx-auto">
        <form method="POST" action="{{ route('transactions.update', $transaction) }}" class="bg-white p-6 rounded shadow">
            @csrf
            @method('PUT')

            <div class="mb-4">
                <label class="block mb-1">Kategoria</label>
                <div class="flex items-center gap-2">
                    <select name="category_id" id="categorySelect" class="w-full border rounded p-2">
                        @foreach($categories as $c)
                            <option 
                                value="{{ $c->id }}" 
                                data-color="{{ $c->color ?? '' }}" 
                                data-type="{{ $c->type }}"
                                @selected($transaction->category_id == $c->id)>
                                {{ $c->name }} ({{ $c->type==='income' ? 'przychód' : 'wydatek' }})
                            </option>
                        @endforeach
                    </select>
                    <span id="colorDot" class="inline-block w-6 h-6 rounded border"></span>
                </div>
                @error('category_id') <div class="text-red-600 text-sm mt-1">{{ $message }}</div> @enderror
            </div>

            <div class="mb-4">
                <label class="block mb-1">Kwota</label>
                <input type="number" step="0.01" name="amount" value="{{ old('amount', $transaction->amount) }}" class="w-full border rounded p-2">
                @error('amount') <div class="text-red-600 text-sm mt-1">{{ $message }}</div> @enderror
            </div>

            <div class="mb-4">
                <label class="block mb-1">Data</label>
                <input type="date" name="date" value="{{ old('date', \Illuminate\Support\Carbon::parse($transaction->date)->toDateString()) }}" class="w-full border rounded p-2">
                @error('date') <div class="text-red-600 text-sm mt-1">{{ $message }}</div> @enderror
            </div>

            <div class="mb-6">
                <label class="block mb-1">Opis (opcjonalnie)</label>
                <textarea name="description" rows="3" class="w-full border rounded p-2">{{ old('description', $transaction->description) }}</textarea>
                @error('description') <div class="text-red-600 text-sm mt-1">{{ $message }}</div> @enderror
            </div>

            <div class="flex gap-2">
                <a href="{{ route('transactions.index') }}" class="px-4 py-2 border rounded">Anuluj</a>
                <button class="px-4 py-2 bg-indigo-600 text-white rounded">Zapisz</button>
            </div>
        </form>
    </div>

    <script>
        const select = document.getElementById('categorySelect');
        const dot = document.getElementById('colorDot');
        function updateDot(){
            const opt = select.options[select.selectedIndex];
            const color = opt.getAttribute('data-color') || '';
            dot.style.background = color || 'transparent';
        }
        select?.addEventListener('change', updateDot);
        updateDot();
    </script>
</x-app-layout>

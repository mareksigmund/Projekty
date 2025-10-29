{{-- resources/views/integrations/mockbank.blade.php --}}
<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl">Integracja: MockBank</h2>
    </x-slot>

    <div class="max-w-xl mx-auto bg-white p-6 rounded shadow space-y-6">
        @if ($envHasKey)
            <div class="p-3 rounded bg-emerald-50 text-emerald-800 text-sm">
                Ten projekt ma ustawiony <strong>globalny klucz API</strong> w .env
                (<code>MOCKBANK_API_KEY</code>). Użytkownik musi podać tylko <strong>Ownera</strong>.
            </div>
        @else
            <div class="p-3 rounded bg-amber-50 text-amber-800 text-sm">
                Brak globalnego klucza <code>MOCKBANK_API_KEY</code> w .env —
                możesz wkleić klucz tu, aby używać go tylko dla tego konta.
            </div>
        @endif

        <form method="POST" action="{{ route('integrations.mockbank.store') }}" class="space-y-4">
            @csrf

            <div>
                <label class="block text-sm mb-1">Owner (email / prefix / ObjectId)</label>
                <input name="owner"
                       class="border rounded p-2 w-full"
                       value="{{ old('owner', $integration->owner ?? '') }}"
                       placeholder="np. alice+test123@example.com albo prefix 'alice'"
                       required>
                <p class="text-xs text-gray-500 mt-1">
                    Prefix dopasuje też adresy w formacie <code>prefix+coś@…</code>.
                </p>
                @error('owner') <div class="text-sm text-rose-600 mt-1">{{ $message }}</div> @enderror
            </div>

            <div>
                <label class="block text-sm mb-1">API Key (opcjonalnie)</label>
                <input name="api_key"
                       class="border rounded p-2 w-full"
                       value="{{ old('api_key', $integration->api_key ?? '') }}"
                       placeholder="{{ $envHasKey ? 'pozostaw puste – użyj klucza z .env' : 'wklej klucz API' }}">
                @error('api_key') <div class="text-sm text-rose-600 mt-1">{{ $message }}</div> @enderror
            </div>

            <div>
                <label class="block text-sm mb-1">Base URL (opcjonalnie)</label>
                <input name="base_url"
                       class="border rounded p-2 w-full"
                       placeholder="{{ $envBase }}"
                       value="{{ old('base_url', $integration->base_url ?? '') }}">
                <p class="text-xs text-gray-500 mt-1">Zostaw puste, by użyć: <code>{{ $envBase }}</code></p>
                @error('base_url') <div class="text-sm text-rose-600 mt-1">{{ $message }}</div> @enderror
            </div>

            <div class="flex gap-2">
                <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">
                    Zapisz
                </button>
                <a href="{{ route('dashboard') }}" class="px-4 py-2 border rounded">Anuluj</a>
            </div>
        </form>
    </div>
</x-app-layout>

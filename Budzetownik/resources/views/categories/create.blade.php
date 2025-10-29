<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl">Nowa kategoria</h2>
    </x-slot>

    <div class="py-6 max-w-xl mx-auto">
        <form method="POST" action="{{ route('categories.store') }}" class="bg-white p-6 rounded shadow">
            @csrf

            <div class="mb-4">
                <label class="block mb-1">Nazwa</label>
                <input name="name" value="{{ old('name') }}" class="w-full border rounded p-2">
                @error('name') <div class="text-red-600 text-sm mt-1">{{ $message }}</div> @enderror
            </div>

            <div class="mb-4">
                <label class="block mb-1">Typ</label>
                <select name="type" class="w-full border rounded p-2">
                    <option value="income" @selected(old('type')==='income')>Przychód</option>
                    <option value="expense" @selected(old('type')==='expense')>Wydatek</option>
                </select>
                @error('type') <div class="text-red-600 text-sm mt-1">{{ $message }}</div> @enderror
            </div>
{{-- KOLOR: paleta + własny --}}
@php
    $palette = [
        ['#f87171','Czerwony'], ['#fb7185','Róż'], ['#fbbf24','Pomarańcz'],
        ['#fde047','Żółty'],   ['#34d399','Zielony'], ['#60a5fa','Niebieski'],
        ['#a78bfa','Fiolet'],  ['#64748b','Slate'],   ['#000000','Czarny'],
    ];
    $oldColor   = old('color', '');
    $isCustom   = $oldColor && !collect($palette)->pluck(0)->contains($oldColor);
@endphp

<div class="mb-6">
    <label class="block mb-1">Kolor (opcjonalnie)</label>

    <div class="flex items-center gap-2">
        <select id="colorPreset" class="border rounded p-2">
            <option value="">— wybierz kolor—</option>
            @foreach($palette as [$hex,$name])
                <option value="{{ $hex }}" @selected(!$isCustom && $oldColor===$hex)>
                    {{ $name }} ({{ $hex }})
                </option>
            @endforeach
            <option value="__custom" @selected($isCustom)>Własny kolor…</option>
        </select>

        <span id="colorDot" class="inline-block w-7 h-7 rounded border"
              style="background: {{ $oldColor ?: 'transparent' }}"></span>
    </div>

    {{-- wartość faktycznie wysyłana do backendu --}}
    <input id="colorInput" name="color"
           value="{{ $oldColor }}"
           class="w-full border rounded p-2 mt-2"
           placeholder="#RRGGBB">

    {{-- systemowy picker pokazujemy tylko przy „Własny kolor…” --}}
    <input id="colorPicker" type="color"
           class="mt-2 h-10 w-16 border rounded p-0 {{ $isCustom ? '' : 'hidden' }}"
           value="{{ $isCustom && $oldColor ? $oldColor : '#60a5fa' }}">

    @error('color') 
        <div class="text-red-600 text-sm mt-1">{{ $message }}</div> 
    @enderror
</div>



            <div class="flex gap-2">
                <a href="{{ route('categories.index') }}" class="px-4 py-2 border rounded">Anuluj</a>
                <button class="px-4 py-2 bg-indigo-600 text-white rounded">Zapisz</button>
            </div>
        </form>
    </div>


    <script>
const preset = document.getElementById('colorPreset');
const input  = document.getElementById('colorInput');
const picker = document.getElementById('colorPicker');
const dot    = document.getElementById('colorDot');

function setDot(hex){ dot.style.background = hex ? hex : 'transparent'; }
function togglePicker(show){ picker.classList.toggle('hidden', !show); }

// stan początkowy
if (preset.value === '__custom') togglePicker(true);

// zmiana presetów
preset?.addEventListener('change', () => {
    if (preset.value === '__custom') {
        togglePicker(true);
        if (!input.value) input.value = picker.value;
        setDot(input.value);
    } else {
        togglePicker(false);
        input.value = preset.value || '';
        setDot(input.value);
    }
});

// zmiana pickera
picker?.addEventListener('input', () => {
    input.value = picker.value;
    setDot(input.value);
});

// ręczna edycja pola tekstowego
input?.addEventListener('input', () => setDot(input.value));
</script>

</x-app-layout>

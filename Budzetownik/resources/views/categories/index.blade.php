<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl">
            Kategorie
        </h2>
    </x-slot>

    <div class="py-6 max-w-4xl mx-auto">
        @if (session('success'))
            <div class="mb-4 p-3 bg-green-100 border border-green-200 rounded">
                {{ session('success') }}
            </div>
        @endif
        @if (session('error'))
            <div class="mb-4 p-3 bg-red-100 border border-red-200 rounded">
                {{ session('error') }}
            </div>
        @endif

        <div class="mb-4">
            <a href="{{ route('categories.create') }}"
               class="inline-block px-4 py-2 bg-indigo-600 text-white rounded">
                + Dodaj kategorię
            </a>
        </div>

        <div class="bg-white shadow rounded overflow-hidden">
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left p-3">Nazwa</th>
                        <th class="text-left p-3">Typ</th>
                        <th class="text-left p-3">Kolor</th>
                        <th class="p-3 text-right">Akcje</th>
                    </tr>
                </thead>
                <tbody>
                @forelse ($categories as $cat)
                    <tr class="border-t">
                        <td class="p-3">{{ $cat->name }}</td>
                        <td class="p-3">
                            @if($cat->type === 'income')
                                <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">Przychód</span>
                            @else
                                <span class="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">Wydatek</span>
                            @endif
                        </td>
                        <td class="p-3">
                            @if($cat->color)
                                <span class="inline-block w-5 h-5 rounded border"
                                      style="background: {{ $cat->color }}"></span>
                                <span class="ml-2 text-gray-600 text-sm">{{ $cat->color }}</span>
                            @else
                                <span class="text-gray-400 text-sm">—</span>
                            @endif
                        </td>
                        <td class="p-3 text-right">
                            <a href="{{ route('categories.edit', $cat) }}"
                               class="px-3 py-1 border rounded mr-2">Edytuj</a>

                            <form action="{{ route('categories.destroy', $cat) }}"
                                  method="POST" class="inline"
                                  onsubmit="return confirm('Na pewno usunąć?');">
                                @csrf
                                @method('DELETE')
                                <button class="px-3 py-1 border rounded text-red-700">
                                    Usuń
                                </button>
                            </form>
                        </td>
                    </tr>
                @empty
                    <tr class="border-t">
                        <td colspan="4" class="p-6 text-center text-gray-500">
                            Brak kategorii. Dodaj pierwszą!
                        </td>
                    </tr>
                @endforelse
                </tbody>
            </table>
        </div>

        <div class="mt-4">
            {{ $categories->links() }}
        </div>
    </div>
</x-app-layout>

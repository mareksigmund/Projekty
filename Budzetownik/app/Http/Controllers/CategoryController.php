<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;

class CategoryController extends Controller
{

    public function __construct()
    {
        $this->middleware('auth');
    }

//LISTA
    public function index(Request $request)
    {
          $categories = $request->user()
            ->categories()
            ->orderBy('type')
            ->orderBy('name')
            ->paginate(10);

        return view('categories.index', compact('categories'));
    }

        // FORMULARZ DODAWANIA
    public function create()
    {
        return view('categories.create');
    }


      // ZAPIS NOWEJ
    public function store(StoreCategoryRequest $request)
    {
        $request->user()->categories()->create([
            'name'  => $request->input('name'),
            'type'  => $request->input('type'),
            'color' => $request->input('color'),
        ]);

        return redirect()
            ->route('categories.index')
            ->with('success', 'Kategoria została dodana.');
    }
    
    
    // FORMULARZ EDYCJI
    public function edit(Request $request, $id)
    {
        
        $category = $request->user()->categories()->findOrFail($id);

        return view('categories.edit', compact('category'));
    }

    // AKTUALIZACJA
    public function update(UpdateCategoryRequest $request, $id)
    {
        $category = $request->user()->categories()->findOrFail($id);

        $category->update([
            'name'  => $request->input('name'),
            'type'  => $request->input('type'),
            'color' => $request->input('color'),
        ]);

        return redirect()
            ->route('categories.index')
            ->with('success', 'Kategoria została zaktualizowana.');
    }



    // USUWANIE
    public function destroy(\Illuminate\Http\Request $request, $id)
    {
        $category = $request->user()->categories()->findOrFail($id);

        // Są transakcje ?
        if ($category->transactions()->exists()) {
            return redirect()
                ->route('categories.index')
                ->with('error', 'Nie można usunąć kategorii, która ma przypisane transakcje.');
        }

        // Nie to usuwamy
        $category->delete();

        return redirect()
            ->route('categories.index')
            ->with('success', 'Kategoria została usunięta.');
    }
}


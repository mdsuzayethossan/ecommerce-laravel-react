<?php

namespace App\Http\Controllers;

use App\Models\AttributeValue;
use App\Models\Attribute;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AttributeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $attributes = Attribute::with('values')->get();
        
        return Inertia::render('attributes/index', [
            'attributes' => $attributes
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('attributes/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:attributes',
            'description' => 'nullable|string',
            'values' => 'required|array|min:1',
            'values.*.value' => 'required|string|max:255',
        ]);

        // Generate slug if not provided
        $slug = $request->slug ?? Str::slug($request->name);
        
        // Create attribute
        $attribute = Attribute::create([
            'name' => $request->name,
            'slug' => $slug,
            'description' => $request->description,
        ]);
        
        // Create attribute values
        foreach ($request->values as $valueData) {
            $valueSlug = $valueData['slug'] ?? Str::slug($valueData['value']);
            
            AttributeValue::create([
                'attribute_id' => $attribute->id,
                'value' => $valueData['value'],
                'slug' => $valueSlug,
            ]);
        }

        return redirect()->route('attributes.index')
            ->with('success', 'Attribute created successfully!');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Attribute $attribute)
    {
        $attribute->load('values');
        
        return Inertia::render('attributes/edit', [
            'attribute' => $attribute
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Attribute $attribute)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:attributes,slug,' . $attribute->id,
            'description' => 'nullable|string',
            'values' => 'required|array|min:1',
            'values.*.id' => 'nullable|exists:attribute_values,id',
            'values.*.value' => 'required|string|max:255',
        ]);

        // Generate slug if not provided
        $slug = $request->slug ?? Str::slug($request->name);
        
        // Update attribute
        $attribute->update([
            'name' => $request->name,
            'slug' => $slug,
            'description' => $request->description,
        ]);
        
        // Keep track of processed value IDs
        $processedValueIds = [];
        
        // Update or create attribute values
        foreach ($request->values as $valueData) {
            if (isset($valueData['id'])) {
                // Update existing value
                $value = AttributeValue::find($valueData['id']);
                
                if ($value && $value->attribute_id === $attribute->id) {
                    $valueSlug = $valueData['slug'] ?? Str::slug($valueData['value']);
                    
                    $value->update([
                        'value' => $valueData['value'],
                        'slug' => $valueSlug,
                    ]);
                    
                    $processedValueIds[] = $value->id;
                }
            } else {
                // Create new value
                $valueSlug = $valueData['slug'] ?? Str::slug($valueData['value']);
                
                $value = AttributeValue::create([
                    'attribute_id' => $attribute->id,
                    'value' => $valueData['value'],
                    'slug' => $valueSlug,
                ]);
                
                $processedValueIds[] = $value->id;
            }
        }
        
        // Delete values that were not in the request
        $attribute->values()
            ->whereNotIn('id', $processedValueIds)
            ->delete();

        return redirect()->route('attributes.index')
            ->with('success', 'Attribute updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Attribute $attribute)
    {
        // This will automatically delete related values due to the cascade constraint
        $attribute->delete();

        return redirect()->route('attributes.index')
            ->with('success', 'Attribute deleted successfully!');
    }
}

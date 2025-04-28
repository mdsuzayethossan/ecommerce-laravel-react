<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use Attribute;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with(['category'])->get();
        $categories = Category::all();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create()
    {
        $categories = Category::all();
        $attributes = Attribute::with('values')->get();

        return Inertia::render('products/create', [
            'categories' => $categories,
            'attributes' => $attributes,
        ]);
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:products',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'price' => 'required_if:is_variable,false|numeric|nullable',
            'sale_price' => 'nullable|numeric|lt:price',
            'sku' => 'required_if:is_variable,false|string|max:100|nullable|unique:products',
            'stock_quantity' => 'required_if:is_variable,false|integer|nullable',
            'is_variable' => 'required|boolean',
            'featured_image' => 'nullable|image|max:2048',
            'gallery_images.*' => 'nullable|image|max:2048',
        ]);

        // Handle slug
        $slug = $request->slug ?? Str::slug($request->name);
        
        // Handle featured image upload
        $featuredImagePath = null;
        if ($request->hasFile('featured_image')) {
            $featuredImagePath = $request->file('featured_image')->store('products', 'public');
        }
        
        // Handle gallery images upload
        $galleryImagePaths = [];
        if ($request->hasFile('gallery_images')) {
            foreach ($request->file('gallery_images') as $image) {
                $galleryImagePaths[] = $image->store('products/gallery', 'public');
            }
        }

        // Create the product
        $product = Product::create([
            'name' => $request->name,
            'slug' => $slug,
            'category_id' => $request->category_id,
            'description' => $request->description,
            'short_description' => $request->short_description,
            'price' => $request->is_variable ? 0 : $request->price,
            'sale_price' => $request->is_variable ? null : $request->sale_price,
            'sku' => $request->is_variable ? null : $request->sku,
            'stock_quantity' => $request->is_variable ? 0 : $request->stock_quantity,
            'is_variable' => $request->is_variable,
            'featured_image' => $featuredImagePath,
            'gallery_images' => $galleryImagePaths,
        ]);

        // Handle variations if it's a variable product
        if ($request->is_variable && $request->has('variations')) {
            foreach ($request->variations as $variation) {
                $variantImagePath = null;
                
                // Handle variant image upload if exists
                if (isset($variation['image']) && $variation['image']) {
                    // If it's a file object from the request
                    if (is_object($variation['image'])) {
                        $variantImagePath = $variation['image']->store('products/variants', 'public');
                    }
                }
                
                // Create the variant
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'price' => $variation['price'],
                    'sale_price' => $variation['sale_price'] ?? null,
                    'stock_quantity' => $variation['stock_quantity'] ?? 0,
                    'sku' => $variation['sku'],
                    'image' => $variantImagePath,
                ]);
                
                // Attach attribute values to this variant
                foreach ($variation['combination'] as $attr) {
                    $variant->attributeValues()->attach($attr['value_id']);
                }
            }
        }

        return redirect()->route('products.index')
            ->with('success', 'Product created successfully!');
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product)
    {
        $product->load(['category', 'variants.attributeValues.attribute']);
        
        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(Product $product)
    {
        $product->load(['variants.attributeValues.attribute']);
        $categories = Category::all();
        $attributes = Attribute::with('values')->get();
        
        return Inertia::render('Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'attributes' => $attributes,
        ]);
    }

    /**
     * Update the specified product in storage.
     */
    public function update(Request $request, Product $product)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:products,slug,' . $product->id,
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string',
            'price' => 'required_if:is_variable,false|numeric|nullable',
            'sale_price' => 'nullable|numeric|lt:price',
            'sku' => 'required_if:is_variable,false|string|max:100|nullable|unique:products,sku,' . $product->id,
            'stock_quantity' => 'required_if:is_variable,false|integer|nullable',
            'is_variable' => 'required|boolean',
            'featured_image' => 'nullable|image|max:2048',
            'gallery_images.*' => 'nullable|image|max:2048',
        ]);

        // Handle slug
        $slug = $request->slug ?? Str::slug($request->name);
        
        // Handle featured image upload
        $featuredImagePath = $product->featured_image;
        if ($request->hasFile('featured_image')) {
            // Delete old image if exists
            if ($featuredImagePath && Storage::disk('public')->exists($featuredImagePath)) {
                Storage::disk('public')->delete($featuredImagePath);
            }
            
            $featuredImagePath = $request->file('featured_image')->store('products', 'public');
        }
        
        // Handle gallery images upload and deletion
        $galleryImagePaths = $product->gallery_images ?? [];
        
        // Handle image deletions
        if ($request->has('delete_gallery_images') && is_array($request->delete_gallery_images)) {
            foreach ($request->delete_gallery_images as $imagePath) {
                if (in_array($imagePath, $galleryImagePaths) && Storage::disk('public')->exists($imagePath)) {
                    Storage::disk('public')->delete($imagePath);
                    
                    // Remove from array
                    $galleryImagePaths = array_filter($galleryImagePaths, function($path) use ($imagePath) {
                        return $path !== $imagePath;
                    });
                }
            }
        }
        
        // Add new gallery images
        if ($request->hasFile('gallery_images')) {
            foreach ($request->file('gallery_images') as $image) {
                $galleryImagePaths[] = $image->store('products/gallery', 'public');
            }
        }

        // Update the product
        $product->update([
            'name' => $request->name,
            'slug' => $slug,
            'category_id' => $request->category_id,
            'description' => $request->description,
            'short_description' => $request->short_description,
            'price' => $request->is_variable ? 0 : $request->price,
            'sale_price' => $request->is_variable ? null : $request->sale_price,
            'sku' => $request->is_variable ? null : $request->sku,
            'stock_quantity' => $request->is_variable ? 0 : $request->stock_quantity,
            'is_variable' => $request->is_variable,
            'featured_image' => $featuredImagePath,
            'gallery_images' => array_values($galleryImagePaths), // Re-index the array
        ]);

        // Handle variations if it's a variable product
        if ($request->is_variable && $request->has('variations')) {
            // Delete variants that are not in the request
            $variantIds = collect($request->variations)
                ->filter(function($var) { return isset($var['id']) && is_numeric($var['id']); })
                ->pluck('id')
                ->toArray();
            
            // Get existing variants not in request to delete
            $variantsToDelete = $product->variants()
                ->whereNotIn('id', $variantIds)
                ->get();
            
            // Delete variants and their images
            foreach ($variantsToDelete as $variant) {
                if ($variant->image && Storage::disk('public')->exists($variant->image)) {
                    Storage::disk('public')->delete($variant->image);
                }
                
                // Detach attribute values
                $variant->attributeValues()->detach();
                
                // Delete the variant
                $variant->delete();
            }
            
            // Update or create variants
            foreach ($request->variations as $variation) {
                $variantData = [
                    'price' => $variation['price'],
                    'sale_price' => $variation['sale_price'] ?? null,
                    'stock_quantity' => $variation['stock_quantity'] ?? 0,
                    'sku' => $variation['sku'],
                ];
                
                // Handle variant image
                if (isset($variation['image']) && $variation['image']) {
                    // If it's a file object
                    if (is_object($variation['image'])) {
                        $variantData['image'] = $variation['image']->store('products/variants', 'public');
                    }
                }
                
                // Check if variant exists or create new
                if (isset($variation['id']) && is_numeric($variation['id'])) {
                    $variant = ProductVariant::find($variation['id']);
                    
                    if ($variant) {
                        // Update existing variant
                        $variant->update($variantData);
                        
                        // Sync attribute values
                        $valueIds = collect($variation['combination'])
                            ->pluck('value_id')
                            ->toArray();
                        
                        $variant->attributeValues()->sync($valueIds);
                    }
                } else {
                    // Create new variant
                    $variant = ProductVariant::create(array_merge(
                        $variantData,
                        ['product_id' => $product->id]
                    ));
                    
                    // Attach attribute values
                    foreach ($variation['combination'] as $attr) {
                        $variant->attributeValues()->attach($attr['value_id']);
                    }
                }
            }
        } else {
            // If product was changed from variable to simple, delete all variants
            if ($product->variants()->count() > 0) {
                foreach ($product->variants as $variant) {
                    if ($variant->image && Storage::disk('public')->exists($variant->image)) {
                        Storage::disk('public')->delete($variant->image);
                    }
                    
                    // Detach attribute values
                    $variant->attributeValues()->detach();
                }
                
                // Delete all variants
                $product->variants()->delete();
            }
        }

        return redirect()->route('products.index')
            ->with('success', 'Product updated successfully!');
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(Product $product)
    {
        // Delete featured image
        if ($product->featured_image && Storage::disk('public')->exists($product->featured_image)) {
            Storage::disk('public')->delete($product->featured_image);
        }
        
        // Delete gallery images
        if ($product->gallery_images) {
            foreach ($product->gallery_images as $image) {
                if (Storage::disk('public')->exists($image)) {
                    Storage::disk('public')->delete($image);
                }
            }
        }
        
        // Delete variants and their images
        foreach ($product->variants as $variant) {
            if ($variant->image && Storage::disk('public')->exists($variant->image)) {
                Storage::disk('public')->delete($variant->image);
            }
            
            // Detach attribute values
            $variant->attributeValues()->detach();
        }
        
        // Delete all variants
        $product->variants()->delete();
        
        // Delete the product
        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Product deleted successfully!');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'short_description',
        'price',
        'sale_price',
        'stock_quantity',
        'sku',
        'is_variable',
        'featured_image',
        'gallery_images',
        'is_featured',
    ];

    protected $casts = [
        'is_variable' => 'boolean',
        'is_featured' => 'boolean',
        'gallery_images' => 'array',
        'price' => 'float',
        'sale_price' => 'float',
    ];

    /**
     * Get the category that owns the product.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the variants for the product.
     */
    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * Get the URL of the featured image.
     */
    public function getFeaturedImageUrlAttribute()
    {
        return $this->featured_image 
            ? asset('storage/' . $this->featured_image) 
            : null;
    }

    /**
     * Get the URLs of gallery images.
     */
    public function getGalleryImageUrlsAttribute()
    {
        if (!$this->gallery_images) {
            return [];
        }

        return array_map(function($image) {
            return asset('storage/' . $image);
        }, $this->gallery_images);
    }

    /**
     * Check if product is on sale.
     */
    public function getIsOnSaleAttribute()
    {
        return !$this->is_variable && $this->sale_price && $this->sale_price < $this->price;
    }

    /**
     * Get final price (accounting for sale price).
     */
    public function getFinalPriceAttribute()
    {
        if ($this->is_variable) {
            $lowestPrice = $this->variants()->min('price');
            $lowestSalePrice = $this->variants()->whereNotNull('sale_price')->min('sale_price');
            
            return $lowestSalePrice && $lowestSalePrice < $lowestPrice ? $lowestSalePrice : $lowestPrice;
        }
        
        return $this->is_on_sale ? $this->sale_price : $this->price;
    }
}

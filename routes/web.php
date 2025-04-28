<?php

use App\Http\Controllers\AttributeController;
use App\Http\Controllers\AttributeValueController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductVariantController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});
// routes/web.php
Route::middleware(['auth'])->prefix('admin')->group(function () {
    Route::resource('categories', CategoryController::class);
    Route::resource('attributes', AttributeController::class);
    Route::resource('attribute-values', AttributeValueController::class);
    Route::resource('products', ProductController::class);
    
    // Special routes for product variations
    Route::post('products/{product}/variations', [ProductVariantController::class, 'store']);
    Route::put('products/{product}/variations/{variant}', [ProductVariantController::class, 'update']);
    Route::delete('products/{product}/variations/{variant}', [ProductVariantController::class, 'destroy']);
    
    // Generate variations based on selected attributes
    Route::post('products/{product}/generate-variations', [ProductVariantController::class, 'generate']);
});
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

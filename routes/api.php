<?php

use App\Http\Controllers\DayTypeController;
use App\Http\Controllers\RateController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ShiftTypeController;
use App\Http\Middleware\StaticJwtMiddleware;
use App\Http\Controllers\LocationController;
use App\Http\Middleware\EncryptCookies;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::middleware(StaticJwtMiddleware::class, EncryptCookies::class)->group(function () {
    Route::apiResource('shift-types', ShiftTypeController::class);
});
Route::middleware(StaticJwtMiddleware::class, EncryptCookies::class)->group(function () {
    Route::apiResource('rates', RateController::class);
});
Route::middleware(StaticJwtMiddleware::class, EncryptCookies::class)->group(function () {
    Route::apiResource('day-types', DayTypeController::class);
});
Route::middleware(StaticJwtMiddleware::class, EncryptCookies::class)->group(function () {
    Route::apiResource('locations', LocationController::class);
});
Route::middleware(StaticJwtMiddleware::class, EncryptCookies::class)->group(function () {
    // Review endpoints
    Route::get('review', [\App\Http\Controllers\ReviewController::class, 'index'])->name('api.review');
    Route::post('review/calculate', [\App\Http\Controllers\ReviewController::class, 'calculate'])->name('api.review.calculate');
    Route::post('review/export', [\App\Http\Controllers\ReviewController::class, 'export'])->name('api.review.export');
    Route::post('review/save', [\App\Http\Controllers\ReviewController::class, 'save'])->name('api.review.save');
});

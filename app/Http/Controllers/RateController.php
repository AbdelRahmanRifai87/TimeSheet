<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Rate;

class RateController extends Controller
{
    // List all Rates
    public function index()
    {
        return response()->json(Rate::all(), 200);
    }

    // Store new Rate
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'shift_type_id' => 'required|integer|exists:shift_types,id',
                'day_type_id' => 'required|integer|exists:day_types,id',
                'rate' => 'required|numeric|min:0.01', // must be > 0
            ]);
            $rate = Rate::create($validated);
            return response()->json($rate, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Show single Rate
    public function show(Rate $rate)
    {
        try {
            return response()->json($rate, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Update Rate
    public function update(Request $request, Rate $rate)
    {
        try {
            $validated = $request->validate([
                'shift_type_id' => 'sometimes|required|integer|exists:shift_types,id',
                'day_type_id' => 'sometimes|required|integer|exists:day_types,id',
                'rate' => 'sometimes|required|numeric|min:0.01', // must be > 0
            ]);
            $rate->update($validated);
            return response()->json($rate, 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Delete Rate
    public function destroy(Rate $rate)
    {
        try {
            $rate->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

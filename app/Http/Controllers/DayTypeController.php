<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DayType;

class DayTypeController extends Controller
{
    // List all DayTypes
    public function index()
    {
        return response()->json(DayType::all(), 200);
    }

    // Store new DayType
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
            ]);
            $dayType = DayType::create($validated);
            return response()->json($dayType, 201);
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

    // Show single DayType
    public function show(DayType $dayType)
    {
        try {
            return response()->json($dayType, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Update DayType
    public function update(Request $request, DayType $dayType)
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
            ]);
            $dayType->update($validated);
            return response()->json($dayType, 200);
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

    // Delete DayType
    public function destroy(DayType $dayType)
    {
        try {
            $dayType->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

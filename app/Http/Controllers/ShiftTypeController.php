<?php

namespace App\Http\Controllers;

use App\Models\ShiftType;
use Illuminate\Http\Request;

class ShiftTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    // List all ShiftTypes
    public function index()
    {
        return response()->json(ShiftType::with('rates')->get(), 200);
    }

    // Store new ShiftType
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:shift_types,name',
                'description' => 'nullable|string',
            ]);
            $ShiftType = ShiftType::create($validated);
            return response()->json($ShiftType, 201);
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

    // Show single ShiftType
    public function show(ShiftType $ShiftType)
    {
        try {
            return response()->json($ShiftType, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Update ShiftType
    public function update(Request $request, ShiftType $ShiftType)
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'sometimes|required|numeric',
            ]);
            $ShiftType->update($validated);
            return response()->json($ShiftType, 200);
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

    // Delete ShiftType
    public function destroy(ShiftType $ShiftType)
    {
        try {
            $ShiftType->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

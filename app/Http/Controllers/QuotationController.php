<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Quotation;
use App\Models\Location; // Ensure Location model is imported
class QuotationController extends Controller
{
    public function index()
    {
        $quotations = Quotation::latest()->paginate(10);
        $locations = Location::all(); // Fetch all locations

        $locationsCount = $locations->count(); // Count of locations
        return view('quotation.index', compact('quotations', 'locations', 'locationsCount'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'quotation_name' => 'required|string|max:255',
            'client_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:sent to client,in_progress,finalized'
        ]);

        try {
            // Create the quotation
            $quotation = Quotation::create([
                'name' => $request->quotation_name,
                'client_name' => $request->client_name,
                'description' => $request->description,
                'status' => $request->status ?? 'sent to client', // Default to sent to client if not provided
                'created_by' => auth()->id() ?? null, // Handle case where user is not authenticated
            ]);
            
            // Store quotation ID in session for the step wizard
            session(['current_quotation_id' => $quotation->id]);

            // Check if this is an AJAX request
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Quotation created successfully!',
                    'quotation' => $quotation
                ]);
            }

            // Regular form submission - redirect to step wizard
            return redirect()->route('home.step2.get')->with('success', 'Quotation created! Now select locations for this quotation.');
            
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error creating quotation: ' . $e->getMessage()
                ], 500);
            }
            
            return back()->withErrors(['error' => 'Error creating quotation: ' . $e->getMessage()])->withInput();
        }
    }
    public function update(Request $request, Quotation $quotation)
    {
        // Add debugging to see what's being sent
        \Log::info('Update quotation request received', [
            'quotation_id' => $quotation->id,
            'request_data' => $request->all(),
            'original_description' => $quotation->description
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:sent to client,in_progress,finalized'
        ]);

        \Log::info('Validation passed', [
            'validated_data' => $validated,
            'description_in_validated' => isset($validated['description']) ? $validated['description'] : 'NOT_SET'
        ]);

        // Store original values before update
        $originalDescription = $quotation->description;
        
        $quotation->update($validated);

        // Check if description actually changed
        $quotation->refresh();
        
        \Log::info('After update', [
            'original_description' => $originalDescription,
            'new_description' => $quotation->description,
            'description_changed' => $originalDescription !== $quotation->description
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Quotation updated successfully',
            'quotation' => $quotation
        ]);
    }

    public function destroy(Quotation $quotation)
    {
        try {
            $quotation->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Quotation deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting quotation: ' . $e->getMessage()
            ], 500);
        }
    }

}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Quotation;

class QuotationController extends Controller
{
    public function index()
    {
        $quotations = Quotation::latest()->paginate(10);
        return view('quotation.index', compact('quotations'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'quotation_name' => 'required|string|max:255',
            'client_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,finalized'
        ]);

        try {
            // Create the quotation
            $quotation = Quotation::create([
                'name' => $request->quotation_name,
                'client_name' => $request->client_name,
                'description' => $request->description,
                'status' => $request->status ?? 'draft', // Default to draft if not provided
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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,finalized'
        ]);

        $quotation->update($validated);

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

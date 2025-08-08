<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Quotation;
use App\Models\Location;
use App\Models\QuotationLocationSchedule;

class HomeController extends Controller
{
    public function step1(Quotation $quotation = null)
    {
        // If quotation is passed as parameter (from Setup Schedule button)
        if ($quotation && $quotation->exists) {
            session(['current_quotation_id' => $quotation->id]);
        }

        $quotationId = session('current_quotation_id');
        
        if (!$quotationId) {
            return redirect()->route('quotation.index')->with('error', 'Please create a quotation first.');
        }

        $quotationModel = Quotation::findOrFail($quotationId);
        
        // Redirect to step2 
        return redirect()->route('home.step2.get');
    }

    public function step2()
    {
        $quotationId = session('current_quotation_id');
        
        if (!$quotationId) {
            return redirect()->route('quotation.index')->with('error', 'Please create a quotation first.');
        }

        $quotation = Quotation::findOrFail($quotationId);
        
        // Load saved location selections for this quotation
        $savedLocationSchedules = QuotationLocationSchedule::where('quotation_id', $quotationId)->get();
        $savedLocationIds = $savedLocationSchedules->pluck('location_id')->toArray();
        
        // Check session for current selections (overrides saved data if present)
        $sessionLocationIds = session('step2.selected_locations', []);
        
        if (!empty($sessionLocationIds)) {
            // Use session data (user is in current flow)
            $selectedLocationIds = $sessionLocationIds;
        } elseif (!empty($savedLocationIds)) {
            // Use saved data (user is returning to edit)
            $selectedLocationIds = $savedLocationIds;
            // Store in session for current flow
            session(['step2.selected_locations' => $selectedLocationIds]);
        } else {
            // No data - show location selection
            $selectedLocationIds = [];
        }
        
        // Always get all locations
        $locations = Location::all();
        
        if (empty($selectedLocationIds)) {
            $showLocationSelection = true;
        } else {
            // Load saved scheduling data for selected locations
            foreach ($locations as $location) {
                if (in_array($location->id, $selectedLocationIds)) {
                    $schedule = $savedLocationSchedules->where('location_id', $location->id)->first();
                    if ($schedule && $schedule->shift_details) {
                        $location->saved_shift_details = $schedule->shift_details;
                        $location->is_configured = $schedule->is_configured;
                    } else {
                        $location->saved_shift_details = [];
                        $location->is_configured = false;
                    }
                    $location->is_selected = true;
                } else {
                    $location->is_selected = false;
                }
            }
            
            $showLocationSelection = false;
        }

        return view('home.step2', compact('quotation', 'locations', 'showLocationSelection', 'savedLocationSchedules'));
    }

    public function step2Submit(Request $request)
    {
        $quotationId = session('current_quotation_id');
        
        if (!$quotationId) {
            return redirect()->route('quotation.index')->with('error', 'Please create a quotation first.');
        }

        // Check if this is location selection or shift scheduling submission
        if ($request->has('selected_locations')) {
            // This is location selection
            $validated = $request->validate([
                'selected_locations' => 'required|json',
                'quotation_id' => 'required|exists:quotations,id'
            ]);

            // Decode the selected_locations JSON array
            $selectedLocations = json_decode($request->input('selected_locations'), true);

            // Save the selected locations to database
            $quotation = Quotation::findOrFail($quotationId);
            
            // Remove existing location schedules for this quotation
            QuotationLocationSchedule::where('quotation_id', $quotationId)->delete();
            
            // Create new location schedule records
            foreach ($selectedLocations as $locationId) {
                QuotationLocationSchedule::create([
                    'quotation_id' => $quotationId,
                    'location_id' => $locationId,
                    'shift_details' => [],
                    'is_configured' => false
                ]);
            }

            // Save in session for current flow
            session([
                'step2.selected_locations' => $selectedLocations,
                'step2.quotation_id' => $quotationId
            ]);

            // Redirect back to step2 to show scheduling interface for selected locations
            return redirect()->route('home.step2.get')->with('success', 'Locations selected! Now configure shifts for each location.');
        } else {
            // This is shift scheduling submission - save shift data and proceed to step3
            $this->saveShiftSchedulingData($request, $quotationId);
            return redirect()->route('details.step3');
        }
    }

    private function saveShiftSchedulingData($request, $quotationId)
    {
        // This method would handle saving shift scheduling data
        // Implementation depends on how the shift data is structured in your form
        // For now, we'll save whatever shift data is in the session to database
        
        $selectedLocations = session('step2.selected_locations', []);
        $shiftSchedule = session('step3.shift_schedule', []);
        
        foreach ($selectedLocations as $locationId) {
            $schedule = QuotationLocationSchedule::where('quotation_id', $quotationId)
                                                ->where('location_id', $locationId)
                                                ->first();
            
            if ($schedule) {
                $schedule->update([
                    'shift_details' => $shiftSchedule,
                    'is_configured' => true
                ]);
            }
        }
    }

    public function saveLocationShiftData(Request $request)
    {
        $quotationId = session('current_quotation_id');
        
        if (!$quotationId) {
            return response()->json(['success' => false, 'message' => 'No quotation found']);
        }

        $validated = $request->validate([
            'location_id' => 'required|exists:locations,id',
            'shift_data' => 'required|array'
        ]);

        try {
            $schedule = QuotationLocationSchedule::updateOrCreate(
                [
                    'quotation_id' => $quotationId,
                    'location_id' => $validated['location_id']
                ],
                [
                    'shift_details' => $validated['shift_data'],
                    'is_configured' => !empty($validated['shift_data'])
                ]
            );

            return response()->json([
                'success' => true, 
                'message' => 'Shift data saved successfully',
                'is_configured' => $schedule->is_configured
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Error saving shift data: ' . $e->getMessage()
            ], 500);
        }
    }

    public function loadLocationShiftData(Request $request)
    {
        $quotationId = session('current_quotation_id');
        
        if (!$quotationId) {
            return response()->json(['success' => false, 'message' => 'No quotation found']);
        }

        $validated = $request->validate([
            'location_id' => 'required|exists:locations,id'
        ]);

        try {
            $schedule = QuotationLocationSchedule::where('quotation_id', $quotationId)
                                                ->where('location_id', $validated['location_id'])
                                                ->first();

            if ($schedule && $schedule->shift_details) {
                return response()->json([
                    'success' => true,
                    'shift_data' => $schedule->shift_details,
                    'is_configured' => $schedule->is_configured
                ]);
            } else {
                return response()->json([
                    'success' => true,
                    'shift_data' => [],
                    'is_configured' => false
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Error loading shift data: ' . $e->getMessage()
            ], 500);
        }
    }

    public function removeLocationsFromQuotation(Request $request)
    {
        $validated = $request->validate([
            'quotation_id' => 'required|exists:quotations,id',
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:locations,id'
        ]);

        try {
            // Remove location schedules for the specified locations
            QuotationLocationSchedule::where('quotation_id', $validated['quotation_id'])
                                    ->whereIn('location_id', $validated['location_ids'])
                                    ->delete();

            // Update session to remove these locations
            $currentSelections = session('step2.selected_locations', []);
            $updatedSelections = array_diff($currentSelections, $validated['location_ids']);
            session(['step2.selected_locations' => array_values($updatedSelections)]);

            return response()->json([
                'success' => true,
                'message' => 'Locations removed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error removing locations: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateQuotationLocations(Request $request)
    {
        $validated = $request->validate([
            'quotation_id' => 'required|exists:quotations,id',
            'location_ids' => 'required|array',
            'location_ids.*' => 'exists:locations,id'
        ]);

        try {
            // Get current location schedules
            $currentSchedules = QuotationLocationSchedule::where('quotation_id', $validated['quotation_id'])
                                                        ->get()
                                                        ->keyBy('location_id');

            // Remove schedules for locations not in the new selection
            QuotationLocationSchedule::where('quotation_id', $validated['quotation_id'])
                                    ->whereNotIn('location_id', $validated['location_ids'])
                                    ->delete();

            // Create schedules for new locations
            foreach ($validated['location_ids'] as $locationId) {
                if (!isset($currentSchedules[$locationId])) {
                    QuotationLocationSchedule::create([
                        'quotation_id' => $validated['quotation_id'],
                        'location_id' => $locationId,
                        'shift_details' => [],
                        'is_configured' => false
                    ]);
                }
            }

            // Update session
            session(['step2.selected_locations' => $validated['location_ids']]);

            return response()->json([
                'success' => true,
                'message' => 'Location selection updated successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating locations: ' . $e->getMessage()
            ], 500);
        }
    }
}

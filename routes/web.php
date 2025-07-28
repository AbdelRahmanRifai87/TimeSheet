<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ShiftTypeController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Cookie;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Show login page on '/'
Route::get('/', [AuthController::class, 'showLoginForm'])->name('login');

// The actual data entry page (step1), protected by JWT middleware
Route::get('/dataentry', [
    App\Http\Middleware\StaticJwtMiddleware::class,
    function () {
        $dayTypes = \App\Models\DayType::all();
        $shiftTypes = \App\Models\ShiftType::with('rates')->get();
        $locations = \App\Models\Location::all();
        return view('dataentry.index_api', compact('dayTypes', 'shiftTypes', 'locations'));
    }
])->name('dataentry.index_api');

Route::get('/home/step2', function () {
     $locations = \App\Models\Location::all(); // Fetch all locations from the database
    return view('home.step2', compact('locations')); // Pass $locations to the view
})->name('home.step2.get');

Route::post('/home/step2', function (\Illuminate\Http\Request $request) {
   $validated = $request->validate([
        'selected_locations' => 'required|json',
    ]);

    // Decode the selected_locations JSON array
    $selectedLocations = json_decode($request->input('selected_locations'), true);

    // Save the selected locations in the session
    session(['step2.selected_locations' => $selectedLocations]);

    return redirect('/details/step3');
})->name('home.step2.submit');

Route::get('/details/step3', function () {
  $selectedLocations = session('step2.selected_locations', []);
    // Pass these to your Blade view
    return view('details.step3', compact('selectedLocations'));
})->name('details.step3');

Route::post('/details/step3', function (\Illuminate\Http\Request $request) {
    // Validate and store shift schedule data
    $validated = $request->validate([
        'shift_schedule' => 'required|array|min:1',
        'shift_schedule.*.day' => 'required|date',
        'shift_schedule.*.date' => 'required|string',
        'shift_schedule.*.shiftType' => 'required|integer',
        'shift_schedule.*.from' => 'required|string',
        'shift_schedule.*.to' => 'required|string',
        'shift_schedule.*.employees' => 'required|integer|min:1',
        'shift_schedule.*.isNew' => 'nullable|boolean',
    ]);

    // Store shift schedule in session
    session([
        'step3.shift_schedule' => $validated['shift_schedule'],
    ]);

    return redirect('/review/step4');
})->name('details.step3.submit');

Route::get('/review/step4', function () {
    // Get all session data
    $shiftTypeIds = session('step2.shift_types', []);
    $locationId = session('step2.location_id');
    $dateRange = session('step2.date_range');
    $shiftSchedule = session('step3.shift_schedule', []);

    // Debug: Check if we have the necessary data
    if (empty($shiftTypeIds) || empty($locationId) || empty($dateRange)) {
        return redirect('/home/step2')->with('error', 'Please complete all previous steps first.');
    }

    // Get related data
    $location = \App\Models\Location::find($locationId);
    $shiftTypes = \App\Models\ShiftType::whereIn('id', $shiftTypeIds)->get();

    // Prepare review data
    $reviewData = [
        'shift_types' => $shiftTypes,
        'location' => $location,
        'date_range' => $dateRange,
        'shift_schedule' => $shiftSchedule,
    ];

    // Pass location name/object safely
    $locationName = $location ? $location->name : 'Unknown Location';

    // Debug: Add session data to view for troubleshooting
    $debugData = [
        'session_step2' => session('step2'),
        'session_step3' => session('step3'),
        'shift_type_ids' => $shiftTypeIds,
        'location_id' => $locationId,
        'date_range' => $dateRange,
        'shift_schedule_count' => count($shiftSchedule),
    ];

    return view('review', compact('reviewData', 'dateRange', 'shiftSchedule', 'debugData'))->with('location', $locationName);
})->name('review.step4');

Route::get('/login', [AuthController::class, 'showLoginForm']);
Route::post('/login', [AuthController::class, 'login'])->name('login');

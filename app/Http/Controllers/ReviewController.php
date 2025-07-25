<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ExportedTimeSheet;
use App\Models\TimesheetShift;
use App\Models\Rate;
use App\Models\DayType;
use App\Models\PublicHoliday;
use App\Models\ShiftType;
use App\Models\Location;
use App\Models\TimeSheet;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Exports\TimesheetExport;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Exception;

class ReviewController extends Controller
{
    // Show the review page or return rates data for API
    public function index(Request $request)
    {
        try {
            // If this is an API request, return rates data
            if ($request->wantsJson() || $request->is('api/*')) {
                // Get all rates with related day types and shift types
                $rates = Rate::with(['dayType', 'shiftType'])
                    ->get()
                    ->map(function ($rate) {
                        return [
                            'id' => $rate->id,
                            'rate' => $rate->rate,
                            'day_type_id' => $rate->day_type_id,
                            'shift_type_id' => $rate->shift_type_id,
                            'day_type_name' => $rate->dayType ? $rate->dayType->name : 'Unknown',
                            'shift_type_name' => $rate->shiftType ? $rate->shiftType->name : 'Unknown',
                        ];
                    });

                return response()->json([
                    'success' => true,
                    'rates' => $rates,
                    'day_types' => DayType::all(),
                    'shift_types' => ShiftType::all(),
                ]);
            }

            // Otherwise return the view
            return view('review');
        } catch (Exception $e) {
            Log::error('Review page load failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load review page'], 500);
        }
    }

    private function prepareTimesheetData($results, $summary)
    {
        try {
            $data = [];
            $headings = [
                'Week Starting',
                'Shift Type',
                'Location',
                'Start Date',
                'Scheduled Start',
                'Scheduled Finish',
                'Scheduled Hours',
                'Employee Number',
                'Day (06–18)',
                'Night (18–06)',
                'Saturday',
                'Sunday',
                'Public Holiday',
                'Client Day Rate',
                'Client Night Rate',
                'Client Sat Rate',
                'Client Sun Rate',
                'Client PH Rate',
                'Client Billable',
            ];

            // Get location name
            $location = null;
            if (isset($summary['location_id']) && $summary['location_id']) {
                $location = Location::find($summary['location_id']);
            }
            $locationName = $location ? $location->name : 'Unknown';

            foreach ($results as $result) {
                try {
                    // Validate result data (different structure than raw shifts)
                    if (!isset($result['date']) || !isset($result['shift_type'])) {
                        Log::warning('Invalid result data: missing required fields', $result);
                        continue;
                    }

                    // Calculate week starting date
                    $date = \Carbon\Carbon::parse($result['date']);
                    $weekStarting = $date->copy()->startOfWeek(\Carbon\Carbon::SUNDAY)->format('Y-m-d');

                    // Initialize values
                    $dayHours = $nightHours = $saturdayHours = $sundayHours = $publicHolidayHours = 0;
                    $clientDayRate = $clientNightRate = $clientSatRate = $clientSunRate = $clientPhRate = 0;

                    // Extract from periods if available
                    if (isset($result['periods']) && is_array($result['periods'])) {
                        foreach ($result['periods'] as $period) {
                            if (!isset($period['period']) || !isset($period['hours'])) {
                                continue;
                            }

                            switch ($period['period']) {
                                case 'day':
                                    $dayHours += $period['hours'];
                                    $clientDayRate = $period['rate'] ?? 0;
                                    break;
                                case 'night':
                                    $nightHours += $period['hours'];
                                    $clientNightRate = $period['rate'] ?? 0;
                                    break;
                                case 'saturday':
                                    $saturdayHours += $period['hours'];
                                    $clientSatRate = $period['rate'] ?? 0;
                                    break;
                                case 'sunday':
                                    $sundayHours += $period['hours'];
                                    $clientSunRate = $period['rate'] ?? 0;
                                    break;
                                case 'public_holiday':
                                    $publicHolidayHours += $period['hours'];
                                    $clientPhRate = $period['rate'] ?? 0;
                                    break;
                            }
                        }
                    }

                    $data[] = [
                        $weekStarting,
                        $result['shift_type'],  // Already a name, not ID
                        $locationName,
                        $result['date'],
                        $result['from'] ?? '',
                        $result['to'] ?? '',
                        $result['hours'] ?? 0,
                        $result['employees'] ?? 1,  // Employee Number
                        $dayHours,
                        $nightHours,
                        $saturdayHours,
                        $sundayHours,
                        $publicHolidayHours,
                        $clientDayRate ?? 0,
                        $clientNightRate ?? 0,
                        $clientSatRate ?? 0,
                        $clientSunRate ?? 0,
                        $clientPhRate ?? 0,
                        $result['billable'] ?? 0,
                    ];

                    Log::info('Processed result successfully', ['date' => $result['date']]);
                } catch (Exception $e) {
                    Log::error('Error processing result: ' . $e->getMessage(), ['result' => $result]);
                    continue;
                }
            }

            Log::info('Timesheet data prepared successfully', ['data_count' => count($data)]);

            return [
                'data' => $data,
                'headings' => $headings
            ];
        } catch (Exception $e) {
            Log::error('Error preparing timesheet data: ' . $e->getMessage());
            return [
                'data' => [],
                'headings' => []
            ];
        }
    }

    // Calculate totals and billable (AJAX)
    public function calculate(Request $request)
    {
        try {
            // Validate request
            $validator = Validator::make($request->all(), [
                'shifts' => 'required|array',
                'shifts.*.date' => 'required|date',
                'shifts.*.from' => 'required|string',
                'shifts.*.to' => 'required|string',
                'shifts.*.shift_type_id' => 'required|integer|exists:shift_types,id',
                'shifts.*.employees' => 'required|integer|min:1',
                'location_id' => 'nullable|integer|exists:locations,id',
                'date_range' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $shifts = $request->input('shifts', []);
            $locationId = $request->input('location_id');
            $dateRange = $request->input('date_range');

            // Fetch all day types, rates, and public holidays with error handling
            try {
                $dayTypes = DayType::all()->keyBy('id');
                $shiftTypes = ShiftType::all()->keyBy('id');
                $rates = Rate::all()->keyBy(function ($rate) {
                    return $rate->shift_type_id . '-' . $rate->day_type_id;
                });
                $holidays = PublicHoliday::pluck('date')->toArray();
            } catch (Exception $e) {
                Log::error('Failed to fetch required data: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to fetch required data'
                ], 500);
            }

            $results = [];
            $totals = [
                'scheduled_hours' => 0,
                'day' => 0,
                'night' => 0,
                'saturday' => 0,
                'sunday' => 0,
                'public_holiday' => 0,
                'billable' => 0,
            ];

            foreach ($shifts as $shift) {
                try {
                    $date = $shift['date'];
                    $from = $shift['from'];
                    $to = $shift['to'];
                    $shiftTypeId = $shift['shift_type_id'];
                    $employees = $shift['employees'];

                    // Validate time format
                    if (!preg_match('/^\d{2}:\d{2}$/', $from) || !preg_match('/^\d{2}:\d{2}$/', $to)) {
                        Log::warning('Invalid time format in shift', ['shift' => $shift]);
                        continue;
                    }

                    $carbonDate = \Carbon\Carbon::parse($date);
                    $dayOfWeek = $carbonDate->format('l');
                    $isHoliday = in_array($date, $holidays);

                    // Convert times to minutes since midnight
                    $fromMinutes = (int)substr($from, 0, 2) * 60 + (int)substr($from, 3, 2);
                    $toMinutes = (int)substr($to, 0, 2) * 60 + (int)substr($to, 3, 2);

                    // If crosses midnight, add 24h to toMinutes
                    if ($toMinutes <= $fromMinutes) {
                        $toMinutes += 24 * 60;
                    }
                    $totalMinutes = $toMinutes - $fromMinutes;
                    $totalHours = $totalMinutes / 60;
                    if ($totalHours < 0) $totalHours = 0;

                    // Split the shift at midnight boundaries
                    $periods = [];
                    $billable = 0;
                    $segmentStart = $fromMinutes;
                    $segmentDate = \Carbon\Carbon::parse($date);

                    while ($segmentStart < $toMinutes) {
                        // Calculate end of this segment (either midnight or end of shift)
                        $segmentEnd = min($toMinutes, (floor($segmentStart / 1440) + 1) * 1440);
                        $minutesInSegment = $segmentEnd - $segmentStart;

                        // Determine the date for this segment
                        $daysToAdd = floor($segmentStart / 1440);
                        $currentDate = $segmentDate->copy()->addDays($daysToAdd)->format('Y-m-d');
                        $currentDayOfWeek = \Carbon\Carbon::parse($currentDate)->format('l');
                        $currentIsHoliday = in_array($currentDate, $holidays);

                        // Calculate day/night split for this segment
                        $dayPeriodStart = 6 * 60;
                        $dayPeriodEnd = 18 * 60;
                        $dayMinutes = 0;
                        $nightMinutes = 0;

                        // If it's a holiday or weekend, all minutes are night (or special)
                        if ($currentIsHoliday || $currentDayOfWeek === 'Saturday' || $currentDayOfWeek === 'Sunday') {
                            $dayMinutes = 0;
                            $nightMinutes = $minutesInSegment;
                        } else {
                            // Calculate overlap with day period
                            $current = $segmentStart % 1440;
                            $end = $current + $minutesInSegment;
                            while ($current < $end) {
                                $minuteOfDay = $current % 1440;
                                $next = min($end, $current + 1);
                                if ($minuteOfDay >= $dayPeriodStart && $minuteOfDay < $dayPeriodEnd) {
                                    $dayMinutes += ($next - $current);
                                } else {
                                    $nightMinutes += ($next - $current);
                                }
                                $current = $next;
                            }
                        }

                        $dayHours = $dayMinutes / 60;
                        $nightHours = $nightMinutes / 60;

                        // Assign periods for this segment
                        if ($currentIsHoliday) {
                            $periods[] = ['type' => 'public_holiday', 'hours' => ($minutesInSegment / 60)];
                        } elseif ($currentDayOfWeek === 'Saturday') {
                            $periods[] = ['type' => 'saturday', 'hours' => ($minutesInSegment / 60)];
                        } elseif ($currentDayOfWeek === 'Sunday') {
                            $periods[] = ['type' => 'sunday', 'hours' => ($minutesInSegment / 60)];
                        } else {
                            if ($dayHours > 0) $periods[] = ['type' => 'day', 'hours' => $dayHours];
                            if ($nightHours > 0) $periods[] = ['type' => 'night', 'hours' => $nightHours];
                        }

                        $segmentStart = $segmentEnd;
                    }

                    $periodResults = [];
                    foreach ($periods as $period) {
                        try {
                            $periodType = $period['type'];
                            $periodHours = $period['hours'];
                            $dayType = DayType::where('name', str_replace('_', ' ', $periodType))->first();
                            $dayTypeId = $dayType ? $dayType->id : null;
                            $rateKey = $shiftTypeId . '-' . $dayTypeId;
                            $rate = isset($rates[$rateKey]) ? $rates[$rateKey]->rate : 0;
                            $periodBillable = $periodHours * $rate * $employees;
                            $billable += $periodBillable;
                            $periodResults[] = [
                                'period' => $periodType,
                                'hours' => $periodHours,
                                'rate' => $rate,
                                'billable' => $periodBillable
                            ];
                            $totals[$periodType] += $periodHours;
                        } catch (Exception $e) {
                            Log::error('Error calculating period: ' . $e->getMessage(), ['period' => $period]);
                        }
                    }

                    $totals['scheduled_hours'] += $totalHours;
                    $totals['billable'] += $billable;

                    $results[] = [
                        'date' => $date,
                        'shift_type' => $shiftTypes[$shiftTypeId]->name ?? 'Unknown',
                        'from' => $from,
                        'to' => $to,
                        'employees' => $employees,
                        'hours' => $totalHours,
                        'periods' => $periodResults,

                        'billable' => $billable,
                    ];
                } catch (Exception $e) {
                    Log::error('Error processing shift: ' . $e->getMessage(), ['shift' => $shift]);
                    continue;
                }
            }

            $timesheetData = $this->prepareTimesheetData($results, $request->all());
            Log::info('Timesheet data prepared:', [
                'data_count' => count($timesheetData['data']),
                'headings_count' => count($timesheetData['headings']),
            ]);
            return response()->json([
                'success' => true,
                'results' => $results,
                'totals' => $totals,
                'timesheet_data' => $timesheetData['data'],
                'timesheet_headings' => $timesheetData['headings'],
            ]);
        } catch (Exception $e) {
            Log::error('Calculate method failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Calculation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // Export to Excel (combined with save)
    public function export(Request $request)
    {
        try {

            Log::info('Export request attributes:', [
                'all_attributes' => $request->attributes->all(),
                'jwt_user' => $request->attributes->get('jwt_user'),
                'headers' => $request->headers->all()
            ]);
            // Validate request
            $validator = Validator::make($request->all(), [
                'data' => 'required|array',
                'headings' => 'required|array',
                'hiddenColumns' => 'nullable|array',
                'totals' => 'nullable|array',
                'date_range' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->input('data', []);
            $headings = $request->input('headings', []);
            $hiddenColumns = $request->input('hiddenColumns', []);
            $totals = $request->input('totals', []);
            $userId = $request->attributes->get('jwt_user')['sub'] ?? null;
            $weekGroups = $request->input('weekGroups', []);

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated'
                ], 401);
            }

            // Validate data is not empty
            if (empty($data)) {
                return response()->json([
                    'success' => false,
                    'error' => 'No data to export'
                ], 400);
            }

            DB::beginTransaction();

            try {
                // Generate filename
                $dateRange = $request->input('date_range', date('Y-m-d'));
                $fileName = 'timesheet_' . str_replace([' ', '/', ':', '-'], ['_', '_', '_', '_'], $dateRange) . '_' . time() . '.xlsx';
                $filePath = 'timesheets/' . $fileName;

                // Ensure directory exists
                if (!file_exists(storage_path('app/public/timesheets'))) {
                    mkdir(storage_path('app/public/timesheets'), 0755, true);
                }

                // Create Excel file
                $export = new TimesheetExport($data, $headings, $hiddenColumns, $totals, $weekGroups);
                \Maatwebsite\Excel\Facades\Excel::store($export, $filePath, 'public');

                // Verify file was created
                if (!file_exists(storage_path('app/public/' . $filePath))) {
                    throw new Exception('Excel file was not created');
                }

                // Save to database
                $timesheet = \App\Models\TimeSheet::create([
                    'file_name' => $fileName,
                    'file_path' => $filePath,
                    'user_id' => $userId,
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Timesheet exported successfully!',
                    'download_url' => asset('storage/' . $filePath),
                    'file_name' => $fileName,
                    'timesheet_id' => $timesheet->id,
                ]);
            } catch (Exception $e) {
                DB::rollback();
                Log::error('Export transaction failed: ' . $e->getMessage());
                throw $e;
            }
        } catch (Exception $e) {
            Log::error('Export method failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Export failed: ' . $e->getMessage()
            ], 500);
        }
    }
}

@php $currentStep = 4; @endphp
@extends('layouts.app')

@section('content')
    <div class="max-w-7xl mx-auto p-6">
        <h2 class="text-2xl font-bold mb-6">Step 4: Review & Export</h2>

        <!-- Summary Section -->
        <div class="mb-6 p-4 border rounded bg-gray-50">
            <h3 class="text-lg font-semibold mb-4">Summary</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <span class="font-medium">Date Range:</span>
                    <span id="summaryDateRange" class="text-gray-700">-</span>
                </div>
                <div>
                    <span class="font-medium">Total Shifts:</span>
                    <span id="summaryTotalShifts" class="text-gray-700">-</span>
                </div>
                <div>
                    <span class="font-medium">Locations:</span>
                    <span id="summaryLocations" class="text-gray-700">-</span>
                </div>
                <div>
                    <span class="font-medium">Shift Types:</span>
                    <span id="summaryShiftTypes" class="text-gray-700">-</span>
                </div>
            </div>
        </div>

        <!-- Rates Table -->
        <div class="mb-6">
            <h3 class="text-lg font-semibold mb-4">Rates</h3>
            <div class="overflow-x-auto">
                <table class="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border border-gray-300 px-4 py-2 text-left">Day Type</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">Shift Type</th>
                            <th class="border border-gray-300 px-4 py-2 text-left">Rate</th>
                        </tr>
                    </thead>
                    <tbody id="ratesTableBody">
                        <!-- Rates will be populated here -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Column Visibility Controls -->
        <div class="mb-6 p-4 border rounded bg-gray-50">
            <h3 class="text-lg font-semibold mb-4">Column Visibility</h3>
            <div class="relative">
                <label class="block text-sm font-medium text-gray-700 mb-2">Select Columns to Display:</label>
                <div class="relative">
                    <select id="columnSelector" multiple
                        class="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm">
                        <!-- Core columns (always visible) -->
                        <option value="week-starting" selected disabled
                            class="font-semibold bg-gray-100 text-gray-700 px-3 py-2">Week Starting
                            (Required)</option>
                        <option value="shift-type" selected disabled
                            class="font-semibold bg-gray-100 text-gray-700 px-3 py-2">Shift Type (Required)
                        </option>
                        <option value="location" selected disabled
                            class="font-semibold bg-gray-100 text-gray-700 px-3 py-2">Location (Required)
                        </option>

                        <!-- Optional columns -->
                        <option value="start-date" selected class="px-3 py-2 hover:bg-blue-50">Start Date</option>
                        <option value="scheduled-start" selected class="px-3 py-2 hover:bg-blue-50">Scheduled Start</option>
                        <option value="scheduled-finish" selected class="px-3 py-2 hover:bg-blue-50">Scheduled Finish
                        </option>
                        <option value="scheduled-hours" selected class="px-3 py-2 hover:bg-blue-50">Scheduled Hours</option>
                        <option value="employee-number" selected class="px-3 py-2 hover:bg-blue-50">Employee Number</option>

                        <!-- Hours columns -->
                        <option value="day-rate" selected class="px-3 py-2 hover:bg-blue-50">Day (06–18)</option>
                        <option value="night-rate" selected class="px-3 py-2 hover:bg-blue-50">Night (18–06)</option>
                        <option value="saturday" selected class="px-3 py-2 hover:bg-blue-50">Saturday</option>
                        <option value="sunday" selected class="px-3 py-2 hover:bg-blue-50">Sunday</option>
                        <option value="public-holiday" selected class="px-3 py-2 hover:bg-blue-50">Public Holiday</option>

                        <!-- Client rate columns -->
                        <option value="client-day-rate" selected class="px-3 py-2 hover:bg-blue-50">Client Day Rate</option>
                        <option value="client-night-rate" selected class="px-3 py-2 hover:bg-blue-50">Client Night Rate
                        </option>
                        <option value="client-sat-rate" selected class="px-3 py-2 hover:bg-blue-50">Client Sat Rate</option>
                        <option value="client-sun-rate" selected class="px-3 py-2 hover:bg-blue-50">Client Sun Rate</option>
                        <option value="client-ph-rate" selected class="px-3 py-2 hover:bg-blue-50">Client PH Rate</option>
                        <option value="client-billable" selected class="px-3 py-2 hover:bg-blue-50">Client Billable</option>

                    </select>
                </div>
                <p class="mt-2 text-sm text-gray-500">Hold Ctrl (Cmd on Mac) to select/deselect multiple columns. Core
                    columns are required and cannot be deselected.</p>
            </div>
        </div>

        <!-- Preview Table -->
        <div class="mb-6">
            <h3 class="text-lg font-semibold mb-4">Preview</h3>
            <div class="overflow-x-auto">
                <table id="previewTable" class="display">
                    <thead id="previewTableHead1"></thead>
                    <tbody id="previewTableBody1"></tbody>
                </table>
            </div>

        </div>


        <!-- Totals Section -->
        <div class="mb-6 p-4 border rounded bg-blue-50">
            <h3 class="text-lg font-semibold mb-4">Totals</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <span class="font-medium">Total Hours:</span>
                    <span id="totalHours" class="text-gray-700">0</span>
                </div>
                <div>
                    <span class="font-medium">Total Cost:</span>
                    <span id="totalCost" class="text-gray-700">$0.00</span>
                </div>
                <div>
                    <span class="font-medium">Day Hours:</span>
                    <span id="totalDayHours" class="text-gray-700">0</span>
                </div>
                <div>
                    <span class="font-medium">Night Hours:</span>
                    <span id="totalNightHours" class="text-gray-700">0</span>
                </div>
                <div>
                    <span class="font-medium">Saturday Hours:</span>
                    <span id="totalSatHours" class="text-gray-700">0</span>
                </div>
                <div>
                    <span class="font-medium">Sunday Hours:</span>
                    <span id="totalSunHours" class="text-gray-700">0</span>
                </div>
                <div>
                    <span class="font-medium">Public Holiday Hours:</span>
                    <span id="totalPHHours" class="text-gray-700">0</span>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-between">
            <button type="button" onclick="window.history.back()"
                class="bg-gray-400 text-white px-4 py-2 rounded mr-2">Back</button>
            <div class="flex gap-2">
                {{-- <button type="button" id="calculateBtn"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">Calculate</button> --}}
                <button type="button" id="exportBtn"
                    class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded">Export Table</button>
            </div>
        </div>

        <!-- Loading Overlay -->
        <div id="loadingOverlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
            <div class="bg-white p-6 rounded-lg">
                <div class="flex items-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    <span>Processing...</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toastContainer" class="fixed top-4 right-4 z-50 space-y-2"></div>

    <script>

    </script>

    <script>
        // Pass data from backend to frontend
        window.reviewData = @json($reviewData ?? []);
        window.dateRange = @json($dateRange ?? '');
        window.locationName = @json($location ?? '');
        window.shiftSchedule = @json($shiftSchedule ?? []);
        window.staticJwt = '{{ env("STATIC_JWT") }}';
    </script>
    @vite(['resources/js/review-standalone.js'])
@endsection
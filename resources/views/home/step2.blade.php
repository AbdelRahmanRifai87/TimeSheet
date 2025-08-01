@php $currentStep = 2; @endphp
@extends('layouts.app')

@section('content')
    <div class="max-w-4xl mx-auto p-6 overflow-y-auto">
        <h2 class="text-2xl font-bold mb-6">Step 2: Home</h2>
        <form id="step2Form" class="space-y-6" method="POST" action="{{ route('home.step2.submit') }}">
            @csrf
            <div class="flex justify-between mt-4">
                <!-- Back Button -->
                <button type="button" id="backBtn"
                    class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded border">
                    Back
                </button>

                <!-- Next Button -->
                <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded border">
                    Next
                </button>
            </div>

            @foreach ($locations as $location)
                <div class="border border-gray-300 rounded p-4 mb-4">
                    <!-- Location Header -->
                    <div class="cursor-pointer" onclick="toggleForm('{{ $location->id }}')">
                        <div class="flex justify-between items-center ">
                            <h3 class="text-lg font-semibold">{{ $location->name }}</h3>
                            <span id="arrow_{{ $location->id }}" class="text-sm text-gray-500">
                                <!-- Down arrow by default -->
                                <i class="fas fa-chevron-down"></i>
                            </span>
                        </div>
                        <p class="text-sm text-gray-600">{{ $location->address }}</p>
                    </div>

                    <!-- Hidden Form -->
                    <div id="form_{{ $location->id }}"
                        class="overflow-hidden max-h-0 transition-all duration-300 ease-in-out mt-4">
                        <!-- Shift Types Dropdown -->
                        <div>
                            <div class="flex justify-between items-center">
                                <label for="shiftTypes_{{ $location->id }}" class="block text-sm font-medium mb-1">Select
                                    Shift
                                    Types</label>
                                <button type="button"
                                    class="bg-blue-500 text-white mb-1 px-3 py-1 rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 mt-2 add-shift-type-btn"
                                    data-location-id="{{ $location->id }}">
                                    Add Shift Type
                                </button>
                            </div>
                            <select id="shiftTypes_{{ $location->id }}" name="shift_types[{{ $location->id }}][]" multiple
                                class="form-multiselect w-full border border-gray-300 rounded px-3 py-2">
                                <!-- Options will be loaded by JS -->
                            </select>
                            <div class="text-red-500 text-xs mt-1" id="shiftTypesError_{{ $location->id }}"></div>
                        </div>

                        <!-- Date Range Input -->
                        <div class="mt-4">
                            <label for="dateRange_{{ $location->id }}" class="block text-sm font-medium mb-1">Date
                                Range</label>
                            <input type="text" id="dateRange_{{ $location->id }}"
                                name="date_range[{{ $location->id }}]"
                                class="form-input w-full border border-gray-300 rounded px-3 py-2"
                                placeholder="Select date range (YYYY-MM-DD to YYYY-MM-DD)">
                            <div class="text-red-500 text-xs mt-1" id="dateRangeError_{{ $location->id }}"></div>
                        </div>
                        <div class="flex justify-end mt-4">
                            <button type="button" id="saveBtn_{{ $location->id }}"
                                class="bg-blue-600 text-white px-4 py-2 rounded">
                                Continue to details

                                <i class="fas fa-check ml-2 hidden" id="checkIcon_{{ $location->id }}"></i>
                            </button>
                        </div>
                        <!-- New Shift Details Section -->
                        <div class="mt-4 border p-2 rounded bg-gray-50 hidden" id="batchForm_{{ $location->id }}">
                            <h3 class="text-lg font-semibold mb-2">Shift Details</h3>
                            {{-- <div class="flex flex-wrap gap-4 items-end">
                                <div class="flex flex-wrap gap-4 w-full">
                                    <!-- Shift Type Dropdown -->
                                    <div class="flex-1">
                                        <label class="block mb-1 font-semibold">Shift Type</label>
                                        <select id="batchShiftType_{{ $location->id }}"
                                            class="border rounded px-2 py-1 w-full">
                                            <option value="">Select</option>
                                            <!-- Options will be loaded by JS -->
                                        </select>
                                    </div>

                                    <!-- From Time -->
                                    <div class="flex-1">
                                        <label class="block mb-1 font-semibold">From</label>
                                        <input type="time" id="batchFrom_{{ $location->id }}"
                                            class="border rounded px-2 py-1 w-full" />
                                    </div>

                                    <!-- To Time -->
                                    <div class="flex-1">
                                        <label class="block mb-1 font-semibold">To</label>
                                        <input type="time" id="batchTo_{{ $location->id }}"
                                            class="border rounded px-2 py-1 w-full" />
                                    </div>

                                    <!-- Number of Employees -->
                                    <div class="flex-1">
                                        <label class="block mb-1 font-semibold"># Employees</label>
                                        <input type="number" id="batchEmployees_{{ $location->id }}"
                                            class="border rounded px-2 py-1 w-full" min="1" value="1" />
                                    </div>
                                </div>
                                <!-- Days Multi-select -->
                                <div class="w-full flex flex-col">
                                    <label class="block  font-semibold">Days</label>
                                    <div id="daysButtonsContainer" class="flex gap-2 mb-2 ">
                                        <button type="button" id="weekdaysBtn"
                                            class="btn hover:bg-blue-500 hover:text-white text-black font-bold py-1 px-2 rounded">Weekdays</button>
                                        |
                                        <button type="button" id="weekendsBtn"
                                            class="btn hover:bg-blue-500 hover:text-white text-black font-bold py-1 px-2 rounded">Weekends</button>
                                        |
                                        <button type="button" id="allDaysBtn"
                                            class="btn hover:bg-blue-500 hover:text-white text-black font-bold py-1 px-2 rounded">All
                                            Days</button>
                                    </div>
                                    <select id="batchDays_{{ $location->id }}" class="border rounded px-2 py-1 w-full"
                                        multiple size="7"></select>
                                    <div class="w-full mt-1 flex gap-2">
                                        <button type="button" id="addShiftBtn_{{ $location->id }}"
                                            class="bg-blue-600 text-white px-4 py-2 rounded">Add Shift</button>
                                        <button type="button" id="updateShiftBtn_{{ $location->id }}"
                                            class="bg-blue-600 text-white px-4 py-2 rounded">Update Shift</button>
                                    </div>
                                </div>
                            </div> --}}

                            <div class="mb-4 mt-2 flex items-center gap-4">
                                <label>Filter by Day:</label>
                                <select id="filterDay_{{ $location->id }}" class="border rounded px-2 py-1">
                                    <option value="">All</option>
                                    <option value="Mon">Monday</option>
                                    <option value="Tue">Tuesday</option>
                                    <option value="Wed">Wednesday</option>
                                    <option value="Thu">Thursday</option>
                                    <option value="Fri">Friday</option>
                                    <option value="Sat">Saturday</option>
                                    <option value="Sun">Sunday</option>
                                </select>
                                <label class="ml-4">Filter by Shift Type:</label>
                                <select id="filterShiftType_{{ $location->id }}" class="border rounded px-2 py-1">
                                    <option value="">All</option>
                                    <!-- Shift types will be dynamically populated -->
                                </select>
                            </div>


                            <!-- Shift Details Table -->
                            <table class="min-w-full border mt-4" id="shiftTable_{{ $location->id }}">
                                <thead>
                                    <tr>
                                        <th class="border px-2 py-1">Day</th>
                                        <th class="border px-2 py-1">Shift Type</th>
                                        <th class="border px-2 py-1">From</th>
                                        <th class="border px-2 py-1">To</th>
                                        <th class="border px-2 py-1"># Employees</th>
                                        <th class="border px-2 py-1">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <!-- Rows will be rendered by JS -->
                                </tbody>
                            </table>
                        </div>



                    </div>
                </div>
                <!-- Modal for Batch Form -->
                <div id="batchFormModal_{{ $location->id }}"
                    class="hidden fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg shadow-lg w-3/4 max-w-4xl p-6 relative">
                        <!-- Close Button -->
                        <button type="button" id="closeBatchFormModal_{{ $location->id }}"
                            class="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                            &times;
                        </button>

                        <!-- Batch Form Content -->
                        <h3 class="text-lg font-semibold mb-4">Batch Form</h3>
                        <div class="flex flex-wrap gap-4 items-end">
                            <div class="flex flex-wrap gap-4 w-full">
                                <!-- Shift Type Dropdown -->
                                <div class="flex-1">
                                    <label class="block mb-1 font-semibold">Shift Type</label>
                                    <select id="batchShiftType_{{ $location->id }}"
                                        class="border rounded px-2 py-1 w-full">
                                        <option value="">Select</option>
                                        <!-- Options will be loaded by JS -->
                                    </select>
                                </div>

                                <!-- From Time -->
                                <div class="flex-1">
                                    <label class="block mb-1 font-semibold">From</label>
                                    <input type="time" id="batchFrom_{{ $location->id }}"
                                        class="border rounded px-2 py-1 w-full" />
                                </div>

                                <!-- To Time -->
                                <div class="flex-1">
                                    <label class="block mb-1 font-semibold">To</label>
                                    <input type="time" id="batchTo_{{ $location->id }}"
                                        class="border rounded px-2 py-1 w-full" />
                                </div>

                                <!-- Number of Employees -->
                                <div class="flex-1">
                                    <label class="block mb-1 font-semibold"># Employees</label>
                                    <input type="number" id="batchEmployees_{{ $location->id }}"
                                        class="border rounded px-2 py-1 w-full" min="1" value="1" />
                                </div>
                            </div>

                            <!-- Days Multi-select -->
                            <div class="w-full flex flex-col">
                                <label class="block font-semibold">Days</label>
                                <div id="daysButtonsContainer" class="flex gap-2 mb-2">
                                    <button type="button" id="weekdaysBtn_{{ $location->id }}"
                                        class="btn hover:bg-blue-500 hover:text-white text-black font-bold py-1 px-2 rounded">Weekdays</button>
                                    <button type="button" id="weekendsBtn_{{ $location->id }}"
                                        class="btn hover:bg-blue-500 hover:text-white text-black font-bold py-1 px-2 rounded">Weekends</button>
                                    <button type="button" id="allDaysBtn_{{ $location->id }}"
                                        class="btn hover:bg-blue-500 hover:text-white text-black font-bold py-1 px-2 rounded">All
                                        Days</button>
                                </div>
                                <select id="batchDays_{{ $location->id }}" class="border rounded px-2 py-1 w-full"
                                    multiple size="7"></select>
                            </div>
                        </div>

                        <!-- Modal Actions -->
                        <div class="flex justify-end mt-4">
                            <button type="button" id="cancelBatchFormBtn_{{ $location->id }}"
                                class="bg-gray-500 text-white px-4 py-2 rounded mr-2">Cancel</button>
                            <button type="button" id="saveBatchFormBtn_{{ $location->id }}"
                                class="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
                        </div>
                    </div>
                </div>
            @endforeach
            <!-- Hidden input to store selected locations -->
            <input type="hidden" id="selectedLocationsInput" name="selected_locations" value="[]">


        </form>



        <!-- Modal for Adding Shift Type -->
        <div id="addShiftTypeModal"
            class="hidden fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
            <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                <h2 class="text-lg font-bold mb-4">Add Shift Type</h2>
                <form id="addShiftTypeForm">
                    <table class="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border border-gray-300 px-4 py-2 text-left">Name</th>
                                <th class="border border-gray-300 px-4 py-2 text-left">Description</th>
                                <th class="border border-gray-300 px-4 py-2 text-left">Day Rate</th>
                                <th class="border border-gray-300 px-4 py-2 text-left">Night Rate</th>
                                <th class="border border-gray-300 px-4 py-2 text-left">Saturday Rate</th>
                                <th class="border border-gray-300 px-4 py-2 text-left">Sunday Rate</th>
                                <th class="border border-gray-300 px-4 py-2 text-left">Public Holiday Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="border border-gray-300 px-4 py-2">
                                    <input type="text" id="shiftTypeName" name="name"
                                        class="form-input w-full border border-gray-300 rounded px-3 py-2">
                                </td>
                                <td class="border border-gray-300 px-4 py-2">
                                    <textarea id="shiftTypeDescription" name="description"
                                        class="form-textarea w-full border border-gray-300 rounded px-3 py-2"></textarea>
                                </td>
                                <td class="border border-gray-300 px-4 py-2">
                                    <input type="number" id="dayRate" name="day_rate"
                                        class="form-input w-full border border-gray-300 rounded px-3 py-2">
                                </td>
                                <td class="border border-gray-300 px-4 py-2">
                                    <input type="number" id="nightRate" name="night_rate"
                                        class="form-input w-full border border-gray-300 rounded px-3 py-2">
                                </td>
                                <td class="border border-gray-300 px-4 py-2">
                                    <input type="number" id="saturdayRate" name="saturday_rate"
                                        class="form-input w-full border border-gray-300 rounded px-3 py-2">
                                </td>
                                <td class="border border-gray-300 px-4 py-2">
                                    <input type="number" id="sundayRate" name="sunday_rate"
                                        class="form-input w-full border border-gray-300 rounded px-3 py-2">
                                </td>
                                <td class="border border-gray-300 px-4 py-2">
                                    <input type="number" id="publicHolidayRate" name="public_holiday_rate"
                                        class="form-input w-full border border-gray-300 rounded px-3 py-2">
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Modal Actions -->
                    <div class="flex justify-end mt-4">
                        <button type="button" class="bg-gray-500 text-white px-4 py-2 rounded mr-2">Cancel</button>
                        <button type="button" class="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
                    </div>


                </form>
            </div>
        </div>
    </div>
    <!-- Modal for Selecting Shifts -->
    <div id="selectShiftModal"
        class="hidden fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-lg w-3/4 max-w-4xl">
            <div class="p-4 border-b">
                <h3 class="text-lg font-semibold">Select Shifts to Update</h3>
            </div>
            <div class="p-4">
                <!-- Table for displaying existing shifts -->
                <div id="selectShiftTableContainer" class="overflow-auto max-h-64">
                    <!-- Table will be dynamically populated by JavaScript -->
                </div>
            </div>
            <div class="p-4 border-t flex justify-end gap-2">
                <button id="cancelSelectShiftBtn" class="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                <button id="confirmSelectShiftBtn" class="bg-blue-600 text-white px-4 py-2 rounded">Confirm</button>
            </div>
        </div>
    </div>


    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script>
        // Toggle visibility of the form for a specific location and update the arrow icon
        // function toggleForm(locationId) {
        //     const form = document.getElementById(`form_${locationId}`);
        //     const arrow = document.getElementById(`arrow_${locationId}`);

        //     // Toggle the hidden class
        //     form.classList.toggle('hidden');

        //     // Update the arrow icon
        //     if (form.classList.contains('hidden')) {
        //         arrow.innerHTML = '<i class="fas fa-chevron-down"></i>'; // Down arrow
        //     } else {
        //         arrow.innerHTML = '<i class="fas fa-chevron-up"></i>'; // Up arrow
        //     }
        // }
        const locations = @json($locations);
        window.staticJwt = @json(env('STATIC_JWT'));
        window.selectedShiftTypes = @json(session('step2.shift_types', []));
        window.selectedLocationId = @json(session('step2.location_id', ''));
        window.selectedDateRange = @json(session('step2.date_range', ''));
    </script>
    @vite('resources/js/Step2/step2.js')
@endsection

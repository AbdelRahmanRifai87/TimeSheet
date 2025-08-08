@php $currentStep = 2; @endphp
@extends('layouts.app')

@section('content')
    <div class="w-[100%]  overflow-y-auto bg-white-100">
        <form id="step2Form" class="space-y-6" method="POST" action="{{ route('home.step2.submit') }}">
            @csrf
            <div class="flex justify-between items-center  ">
                <h2 class="text-2xl text-[#2679b5] ">Locations:</h2>
                <!-- Back Button -->
                <div class="flex gap justify-end gap-4 ">
                    <!-- Back Button -->
                    <button type="button" id="backBtn"
                        class="bg-[#428bca] hover:bg-blue-600 text-white px-3 py-2 rounded border">
                        Add/Edit Locations
                    </button>

                    <!-- Next Button -->
                    <button type="submit" class="bg-[#87b87f] hover:bg-lime-700 text-white px-3 py-2 rounded border">
                        Add/Edit Shift Types
                    </button>
                </div>
            </div>
    </div>


    @foreach ($locations as $location)
        <div class="border border-gray-300 rounded  mt-2 mb-6 bg-gray-100">
            <!-- Location Header -->
            <div class="cursor-pointer p-2" onclick="toggleForm('{{ $location->id }}')">
                <div class="flex justify-between items-center mb-2">
                    <h3 class="text-lg text-[#2679b5] ">{{ $location->name }}</h3>
                    <span id="arrow_{{ $location->id }}" class="text-sm text-gray-500">
                        <!-- Down arrow by default -->
                        <i class="fas fa-chevron-down"></i>
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <p class="text-sm text-gray-600">{{ $location->address }}</p>
                    <p id="totalsDisplay_{{ $location->id }}" class="text-sm text-gray-700 mt-2"></p>

                </div>
            </div>

            <!-- Hidden Form -->
            <div id="form_{{ $location->id }}"
                class="overflow-hidden max-h-0 transition-all duration-700 ease-in-out bg-white ">
                <!-- Shift Types Dropdown -->

                <div class="flex justify-end items-center mr-5">
                    {{-- <label for="shiftTypes_{{ $location->id }}"
                                    class="block text-sm  mb-1 text-[#2679b5]">Select
                                    Shift
                                    Types</label> --}}

                </div>
                {{-- <select id="shiftTypes_{{ $location->id }}" name="shift_types[{{ $location->id }}][]" multiple
                                class="form-multiselect w-full border border-gray-300 rounded px-3 py-2">
                                <!-- Options will be loaded by JS -->
                            </select> --}}
                {{-- <div class="text-red-500 text-xs mt-1" id="shiftTypesError_{{ $location->id }}"></div> --}}


                {{-- <!-- Date Range Input -->
                        <div class="mt-4">
                            <label for="dateRange_{{ $location->id }}" class="block text-sm text-[#2679b5] mb-1">Date
                                Range</label>
                            <input type="text" id="dateRange_{{ $location->id }}" name="date_range[{{ $location->id }}]"
                                class="form-input w-full border border-gray-300 rounded px-3 py-2"
                                placeholder="Select date range (YYYY-MM-DD to YYYY-MM-DD)">
                            <div class="text-red-500 text-xs mt-1" id="dateRangeError_{{ $location->id }}"></div>
                        </div> --}}
                {{-- <div class="flex justify-end mt-4">
                            <button type="button" id="saveBtn_{{ $location->id }}"
                                class="bg-[#337ab7] text-white px-4 py-2 rounded">
                                Continue to details

                                <i class="fas fa-check ml-2 hidden" id="checkIcon_{{ $location->id }}"></i>
                            </button>
                        </div> --}}
                <!-- New Shift Details Section -->
                <div class="mt-1   rounded mx-5  " id="batchForm_{{ $location->id }}">
                    {{-- <h3 class="text-lg text-[#2679b5] mb-2 bg-gray-100 p-2">Shift Details</h3> --}}
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
                    <div class="flex justify-between items-center mt-2 ">


                        <div class="  flex items-center gap-4 p-2">
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
                        <button type="button"
                            class="bg-[#428bca] text-white  px-3 py-1 rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-400  add-shift-type-btn"
                            data-location-id="{{ $location->id }}">
                            Add New Entry
                        </button>
                    </div>


                    <!-- Shift Details Table -->
                    <table class="min-w-full border mt-1" id="shiftTable_{{ $location->id }}">
                        <thead>
                            <tr>
                                <th class="border px-2 py-1">Day</th>
                                <th class="border px-2 py-1">Shift Type</th>
                                <th class="border px-2 py-1">Date Range</th>

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
                    <div class="flex justify-end">
                        <button type="button" id="saveBtn_{{ $location->id }}"
                            class="bg-[#87b87f] hover:bg-lime-700 text-white px-3 py-2 rounded border mt-3 ">
                            <span class="save-btn-text">Save and Review</span>
                            <span class="save-btn-spinner hidden">
                                <i class="fas fa-spinner fa-spin"></i>
                            </span>
                            <span class="save-btn-check hidden" id="checkIcon_{{ $location->id }}">
                                <i class="fas fa-check"></i>
                            </span>
                        </button>
                    </div>
                </div>


            </div>
        </div>
        <!-- Modal for Batch Form -->
        <div id="batchFormModal_{{ $location->id }}"
            class="hidden fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
            <div class="relative bg-white rounded-lg shadow-lg w-3/4 max-w-4xl p-6">

                <div class=" ">
                    <!-- Close Button -->
                    <button type="button" id="closeBatchFormModal_{{ $location->id }}"
                        class="absolute text-3xl top-2 right-2 text-gray-500 hover:text-gray-700">
                        &times;
                    </button>

                    <!-- Batch Form Content -->
                    <h3 class=" text-lg mb-4 text-[#2679b5]">Batch Form</h3>
                </div>

                <div class="flex flex-wrap gap-4 items-end">
                    <div class="flex flex-wrap gap-4 w-full">
                        <!-- Shift Type Dropdown -->
                        <div class="flex-1">
                            <label class="block mb-1  text-[#2679b5]">Shift Type</label>
                            <select id="batchShiftType_{{ $location->id }}" class="border rounded px-2 py-1 w-full">
                                <option value="">Select</option>
                                <!-- Options will be loaded by JS -->
                            </select>
                        </div>

                        <!-- From Time -->
                        <div class="flex-1">
                            <label class="block mb-1  text-[#2679b5]">From</label>
                            <input type="time" id="batchFrom_{{ $location->id }}"
                                class="border rounded px-2 py-1 w-full" />
                        </div>

                        <!-- To Time -->
                        <div class="flex-1">
                            <label class="block mb-1  text-[#2679b5]">To</label>
                            <input type="time" id="batchTo_{{ $location->id }}"
                                class="border rounded px-2 py-1 w-full" />
                        </div>

                        <!-- Number of Employees -->
                        <div class="flex-1">
                            <label class="block mb-1  text-[#2679b5]"># Employees</label>
                            <input type="number" id="batchEmployees_{{ $location->id }}"
                                class="border rounded px-2 py-1 w-full" min="1" value="1" />
                        </div>
                    </div>

                    <!-- Days Multi-select -->
                    <div class="w-full flex flex-col">
                        <label class="block text-[#2679b5]">Days</label>
                        <div id="daysButtonsContainer" class="flex gap-1 mb-1 mt-2">
                            <button type="button" id="weekdaysBtn_{{ $location->id }}"
                                class="btn bg-[#428bca] hover:bg-[#337ab7] text-white   py-1 px-2 rounded">Weekdays</button>
                            <button type="button" id="weekendsBtn_{{ $location->id }}"
                                class="btn bg-[#428bca] hover:bg-[#337ab7] text-white py-1 px-2 rounded">Weekends</button>
                            <button type="button" id="allDaysBtn_{{ $location->id }}"
                                class="btn bg-[#428bca] hover:bg-[#337ab7] text-white   py-1 px-2 rounded">All
                                Days</button>
                        </div>
                        <select id="batchDays_{{ $location->id }}" class="border rounded px-2 py-1 w-full" multiple
                            size="7"></select>
                    </div>
                </div>

                <!-- Modal Actions -->
                <div class="flex justify-end mt-4">
                    <button type="button" id="cancelBatchFormBtn_{{ $location->id }}"
                        class="bg-gray-500 text-white px-4 py-2 rounded mr-2">Cancel</button>
                    <button type="button" id="saveBatchFormBtn_{{ $location->id }}"
                        class="bg-[#87b87f] hover:bg-lime-700 text-white px-4 py-2 rounded">Save and review <i
                            class="fa-solid fa-arrow-right ml-1"></i></button>
                </div>

            </div>
        </div>
    @endforeach
    <!-- Hidden input to store selected locations -->
    <input type="hidden" id="selectedLocationsInput" name="selected_locations" value="[]">


    </form>



    <!-- Modal for Adding Shift Type -->
    <div id="addShiftTypeModal" class="hidden fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center">
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
    <!-- Preview Modal -->
    <div id="previewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden  ">
        <div class="bg-white rounded-lg shadow-lg w-[70%] p-6 relative h-[90%]">
            <button type="button" id="closePreviewModal"
                class="absolute top-1 right-2 text-gray-500 hover:text-red-600 text-2xl">&times;</button>
            <!-- Column Visibility Custom Dropdown -->
            <div class="mb-6 p-4 border rounded bg-gray-50 column-visibility-dropdown">
                <h3 class="text-lg font-semibold mb-4">Column Visibility</h3>
                <div class="relative w-full">
                    <button id="columnDropdownBtn" type="button"
                        class="w-full bg-white border-2 border-blue-400 rounded-lg px-4 py-2 text-left flex justify-between items-center shadow-sm focus:outline-none">
                        <span id="columnDropdownText">Select Columns</span>
                        <svg class="w-4 h-4 ml-2 text-blue-500" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    <div id="columnDropdownMenu"
                        class="absolute left-0 mt-2 w-full bg-white border border-blue-200 rounded-lg shadow-lg z-50 hidden max-h-64 overflow-auto">
                        <!-- JS will populate checkboxes here -->
                    </div>
                </div>
                <p class="mt-2 text-sm text-gray-500">Core columns are required and cannot be deselected.</p>
            </div>
            <!-- Preview Table -->
            <div class="mb-6 preview-table-container">
                <h3 class="text-lg font-semibold mb-4">Preview</h3>
                <div class="overflow-x-auto ">
                    <table id="previewTable" class="display  w-full table-fixed">
                        <thead id="previewTableHead1"></thead>
                        <tbody id="previewTableBody1"></tbody>
                    </table>
                </div>
            </div>
            <div id="exportBTN"></div>

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

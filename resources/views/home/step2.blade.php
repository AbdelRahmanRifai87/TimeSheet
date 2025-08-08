@php $currentStep = 2; @endphp
@extends('layouts.app')
@section('head')
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <style>
        .location-form {
            display: none;
        }
    </style>
    
@endsection

@section('content')
    <div class="w-[100%]  overflow-y-auto bg-white-100">
    <!-- Quotation Header -->
    <div class="bg-gray-50 p-4 mb-4 rounded">
        <h1 class="text-xl font-bold text-[#2679b5]">Quotation Name: {{ $quotation->name }}</h1>
        @if($quotation->client_name)
            <p class="text-gray-600">Client Name: {{ $quotation->client_name }}</p>
        @endif
    </div>

    <!-- Location Selection Interface -->
    <div class="bg-white p-4 mb-6 rounded border">
        <h3 class="text-lg font-semibold text-[#2679b5] mb-4">Select Locations for this Quotation</h3>
        
        <!-- Location Selection Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            @foreach($locations as $location)
                <div class="border rounded p-3 hover:bg-gray-50 cursor-pointer location-selector" 
                     data-location-id="{{ $location->id }}">
                    <div class="flex items-center">
                        <input type="checkbox" 
                               id="locationSelect_{{ $location->id }}" 
                               value="{{ $location->id }}" 
                               class="location-checkbox mr-3"
                               data-name="{{ $location->name }}"
                               data-address="{{ $location->address }}"
                               onchange="updateLocationDisplay()">
                        <div class="flex-1" onclick="toggleLocationSelection('{{ $location->id }}')">
                            <div class="font-medium text-sm">{{ $location->name }}</div>
                            <div class="text-xs text-gray-500">{{ $location->address }}</div>
                        </div>
                    </div>
                </div>
            @endforeach
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 mb-4">
            <button type="button" id="selectAllLocations" class="bg-blue-500 text-white px-4 py-2 rounded text-sm">
                Select All
            </button>
            <button type="button" id="clearAllLocations" class="bg-gray-500 text-white px-4 py-2 rounded text-sm">
                Clear All
            </button>
        </div>

        <!-- Selected Count Display -->
        <div class="text-sm text-gray-600">
            <span id="selectedLocationCount">0</span> of {{ $locations->count() }} locations selected
        </div>
    </div>
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

        <form id="mainLocationsForm" class="space-y-6" method="POST" action="{{ route('home.step2.submit') }}">
            @csrf
            <!-- Hidden form for step2.js compatibility -->
            <form id="step2Form" style="display: none;"></form>
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h2 class="text-2xl text-[#2679b5]">Selected Locations:</h2>
                    <p class="text-sm text-gray-600" id="locationStatusMessage">Select locations above to configure shifts</p>
                </div>
                <div class="flex gap-4">
                    <button type="button" id="backToSelectionBtn"
                        class="bg-[#428bca] hover:bg-blue-600 text-white px-3 py-2 rounded border">
                        Edit Location Selection
                    </button>
                    <button type="submit" id="saveAllLocationsBtn" class="bg-[#87b87f] hover:bg-lime-700 text-white px-3 py-2 rounded border">
                        Save Selected Locations
                    </button>
                    <a href="{{ route('quotation.index') }}" class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded">
                        Back to Quotations
                    </a>
                </div>
            </div>

    <!-- Locations Container -->
    <div id="locationsContainer">
    @foreach ($locations as $location)
        <div class="border border-gray-300 rounded mt-2 mb-6 bg-gray-100 location-form" 
             data-location-id="{{ $location->id }}" 
             style="display: none;">
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
    </div>
    <!-- Hidden inputs -->
    <input type="hidden" id="selectedLocationsInput" name="selected_locations" value="[]">
    <input type="hidden" name="quotation_id" value="{{ $quotation->id }}">
    
    <!-- Hidden elements for step2.js compatibility -->
    <div id="locationDropdown" style="display: none;"></div>
    <div id="locationOptions" style="display: none;"></div>
    <div id="selectedLocations" style="display: none;"></div>
    <div id="placeholderText" style="display: none;"></div>
    <div id="selectedLocationsForms" style="display: none;"></div>
    <span id="selectedCount" style="display: none;">0</span>

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
    <div id="previewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
        <div class="bg-white rounded-lg shadow-lg w-[70%] p-6 relative">
            <button type="button" id="closePreviewModal"
                class="absolute top-1 right-2 text-gray-500 hover:text-red-600 text-2xl">&times;</button>
            <!-- Column Visibility Custom Dropdown -->
            <div class="mb-6 p-4 border rounded bg-gray-50">
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
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-4">Preview</h3>
                <div class="overflow-x-auto">
                    <table id="previewTable" class="display  w-full table-fixed">
                        <thead id="previewTableHead1"></thead>
                        <tbody id="previewTableBody1"></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>


    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script>
        // Simplified Location Selection and Display Logic
        document.addEventListener('DOMContentLoaded', function() {
            const locations = @json($locations);
            const quotationId = @json($quotation->id);
            const savedLocationSchedules = @json($savedLocationSchedules ?? []);
            
            let selectedLocationIds = [];

            // Initialize functionality
            initLocationSelection();
            loadSavedShiftData();

            function initLocationSelection() {
                // Select All button
                const selectAllBtn = document.getElementById('selectAllLocations');
                if (selectAllBtn) {
                    selectAllBtn.addEventListener('click', function() {
                        document.querySelectorAll('.location-checkbox').forEach(checkbox => {
                            checkbox.checked = true;
                        });
                        updateLocationDisplay();
                    });
                }

                // Clear All button
                const clearAllBtn = document.getElementById('clearAllLocations');
                if (clearAllBtn) {
                    clearAllBtn.addEventListener('click', function() {
                        document.querySelectorAll('.location-checkbox').forEach(checkbox => {
                            checkbox.checked = false;
                        });
                        updateLocationDisplay();
                    });
                }

                // Show Selected button
                const showSelectedBtn = document.getElementById('showSelectedLocations');
                if (showSelectedBtn) {
                    showSelectedBtn.addEventListener('click', function() {
                        updateLocationDisplay();
                        // Scroll to forms section
                        const formsSection = document.getElementById('locationsContainer');
                        if (formsSection) {
                            formsSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                }

                // Back to selection button
                const backToSelectionBtn = document.getElementById('backToSelectionBtn');
                if (backToSelectionBtn) {
                    backToSelectionBtn.addEventListener('click', function() {
                        const selectionSection = document.querySelector('.bg-white.p-4.mb-6.rounded.border');
                        if (selectionSection) {
                            selectionSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                }

                // Save All Locations button
                const saveAllBtn = document.getElementById('saveAllLocationsBtn');
                if (saveAllBtn) {
                    saveAllBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        // Save all location data before submitting the form
                        const selectedLocationIds = Array.from(document.querySelectorAll('.location-checkbox:checked')).map(cb => cb.value);
                        let savePromises = [];
                        
                        selectedLocationIds.forEach(locationId => {
                            if (window.records && window.records[locationId] && window.records[locationId].length > 0) {
                                savePromises.push(
                                    new Promise((resolve) => {
                                        if (typeof window.saveShiftDataToDatabase === 'function') {
                                            window.saveShiftDataToDatabase(locationId, window.records[locationId]);
                                        }
                                        resolve();
                                    })
                                );
                            }
                        });
                        
                        // Wait for all saves to complete, then submit the form
                        Promise.all(savePromises).then(() => {
                            console.log('All location data saved. Submitting form...');
                            document.getElementById('mainLocationsForm').submit();
                        }).catch((error) => {
                            console.error('Error saving location data:', error);
                            // Submit anyway
                            document.getElementById('mainLocationsForm').submit();
                        });
                    });
                }

                // Add change event listeners to all checkboxes
                document.querySelectorAll('.location-checkbox').forEach(checkbox => {
                    checkbox.addEventListener('change', updateLocationDisplay);
                });

                // Load saved selections
                loadSavedSelections();
            }

            // Load saved shift data from database
            function loadSavedShiftData() {
                console.log('Loading saved shift data...', savedLocationSchedules);
                
                savedLocationSchedules.forEach(schedule => {
                    const locationId = schedule.location_id;
                    const shiftDetails = schedule.shift_details;
                    
                    if (shiftDetails && Array.isArray(shiftDetails) && shiftDetails.length > 0) {
                        console.log(`Loading ${shiftDetails.length} shift records for location ${locationId}`);
                        
                        // Initialize records for this location if not exists
                        if (!window.records) {
                            window.records = {};
                        }
                        if (!window.records[locationId]) {
                            window.records[locationId] = [];
                        }
                        
                        // Load the saved shift details into the records array
                        window.records[locationId] = shiftDetails;
                        
                        // Also save to localStorage for compatibility
                        localStorage.setItem(`records_${locationId}`, JSON.stringify(shiftDetails));
                        
                        // If the location form is visible, render the table
                        const locationForm = document.querySelector(`[data-location-id="${locationId}"]`);
                        if (locationForm && locationForm.style.display !== 'none') {
                            if (typeof window.renderTable === 'function') {
                                window.renderTable(locationId);
                            }
                        }
                    }
                });
            }

            // Save shift data to database
            function saveShiftDataToDatabase(locationId, shiftData) {
                const csrfToken = document.querySelector('meta[name="csrf-token"]');
                if (!csrfToken) {
                    console.error('CSRF token not found');
                    return;
                }

                fetch('/save-location-shift-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken.getAttribute('content')
                    },
                    body: JSON.stringify({
                        location_id: locationId,
                        shift_data: shiftData
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log('Shift data saved successfully for location:', locationId);
                    } else {
                        console.error('Failed to save shift data:', data.message);
                    }
                })
                .catch(error => {
                    console.error('Error saving shift data:', error);
                });
            }

            // Toggle individual location selection
            window.toggleLocationSelection = function(locationId) {
                const checkbox = document.getElementById(`locationSelect_${locationId}`);
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    updateLocationDisplay();
                }
            }

            // Update location display based on selections
            function updateLocationDisplay() {
                const checkedBoxes = document.querySelectorAll('.location-checkbox:checked');
                selectedLocationIds = Array.from(checkedBoxes).map(cb => cb.value);
                
                console.log('Selected location IDs:', selectedLocationIds); // Debug log
                
                // Update selected count
                const countElement = document.getElementById('selectedLocationCount');
                if (countElement) {
                    countElement.textContent = selectedLocationIds.length;
                }
                
                // Update status message
                const statusMessage = document.getElementById('locationStatusMessage');
                if (statusMessage) {
                    if (selectedLocationIds.length === 0) {
                        statusMessage.textContent = 'Select locations above to configure shifts';
                    } else {
                        statusMessage.textContent = `${selectedLocationIds.length} location(s) selected - Configure shifts below`;
                    }
                }
                
                // Show/hide location forms based on selection
                const locationForms = document.querySelectorAll('.location-form');
                locationForms.forEach(form => {
                    const locationId = form.getAttribute('data-location-id');
                    if (selectedLocationIds.includes(locationId)) {
                        form.style.display = 'block';
                        
                        // Load saved data for this location if it exists and not already loaded
                        if (window.records && !window.records[locationId]) {
                            const schedule = savedLocationSchedules.find(s => s.location_id == locationId);
                            if (schedule && schedule.shift_details) {
                                window.records[locationId] = schedule.shift_details;
                                localStorage.setItem(`records_${locationId}`, JSON.stringify(schedule.shift_details));
                                
                                // Render table if renderTable function is available
                                if (typeof window.renderTable === 'function') {
                                    window.renderTable(locationId);
                                }
                            }
                        }
                        
                        // Also try to load using the step2.js function
                        if (typeof window.loadRecordsForLocation === 'function') {
                            window.loadRecordsForLocation(locationId);
                        }
                    } else {
                        form.style.display = 'none';
                    }
                });
                
                // Update hidden input
                const selectedLocationsInput = document.getElementById('selectedLocationsInput');
                if (selectedLocationsInput) {
                    selectedLocationsInput.value = JSON.stringify(selectedLocationIds);
                }
                
                // Save to localStorage
                localStorage.setItem(`quotation_${quotationId}_selected_locations`, JSON.stringify(selectedLocationIds));
            }

            // Make functions globally available
            window.updateLocationDisplay = updateLocationDisplay;
            window.saveShiftDataToDatabase = saveShiftDataToDatabase;

            function loadSavedSelections() {
                // First try to load from saved schedules (database)
                if (savedLocationSchedules && savedLocationSchedules.length > 0) {
                    savedLocationSchedules.forEach(schedule => {
                        const checkbox = document.getElementById(`locationSelect_${schedule.location_id}`);
                        if (checkbox) {
                            checkbox.checked = true;
                        }
                    });
                    updateLocationDisplay();
                    return;
                }

                // Fallback to localStorage
                const savedLocations = localStorage.getItem(`quotation_${quotationId}_selected_locations`);
                if (savedLocations) {
                    try {
                        const locationIds = JSON.parse(savedLocations);
                        locationIds.forEach(id => {
                            const checkbox = document.getElementById(`locationSelect_${id}`);
                            if (checkbox) {
                                checkbox.checked = true;
                            }
                        });
                        updateLocationDisplay();
                    } catch (e) {
                        console.error('Error loading saved locations:', e);
                    }
                }
            }
        });

        // Global variables for step2.js compatibility
        const locations = @json($locations);
        window.staticJwt = @json(env('STATIC_JWT'));
        window.selectedShiftTypes = @json(session('step2.shift_types', []));
        window.selectedLocationId = @json(session('step2.location_id', ''));
        window.selectedDateRange = @json(session('step2.date_range', ''));
        window.quotationId = @json($quotation->id);

        // Initialize global records object
        window.records = {};
        locations.forEach(location => {
            window.records[location.id] = [];
        });

        // Compatibility function for step2.js
        window.getSelectedLocations = function() {
            const selectedLocationIds = Array.from(document.querySelectorAll('.location-checkbox:checked')).map(cb => cb.value);
            return selectedLocationIds.map(id => {
                const location = locations.find(loc => loc.id == id);
                return location || { id: id };
            });
        };

        // Compatibility function for step2.js validation
        window.validateStep2Form = function() {
            const selectedLocationIds = Array.from(document.querySelectorAll('.location-checkbox:checked')).map(cb => cb.value);
            if (selectedLocationIds.length === 0) {
                alert('Please select at least one location.');
                return false;
            }
            return true;
        };
    </script>
    @vite('resources/js/Step2/step2.js')
@endsection

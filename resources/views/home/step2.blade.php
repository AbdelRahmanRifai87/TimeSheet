@php $currentStep = 2; @endphp
@extends('layouts.app')
@section('head')
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <style>
        .location-form {
            display: none;
        }

        /* Custom styles for multiselect dropdown */
        .location-pill {
            display: inline-flex !important;
            align-items: center !important;
            background-color: #2563eb !important;
            color: white !important;
            padding: 0.375rem 0.75rem !important;
            border-radius: 9999px !important;
            font-size: 0.875rem !important;
            font-weight: 500 !important;
            margin: 0.125rem !important;
            transition: all 0.2s ease-in-out !important;
            border: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;
        }

        .location-pill:hover {
            background-color: #1d4ed8 !important;
            transform: translateY(-1px) !important;
        }

        .location-pill .remove-btn {
            margin-left: 0.5rem !important;
            padding: 0.125rem !important;
            border-radius: 50% !important;
            background-color: rgba(255, 255, 255, 0.2) !important;
            cursor: pointer !important;
            transition: background-color 0.2s ease-in-out !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }

        .location-pill .remove-btn:hover {
            background-color: rgba(255, 255, 255, 0.3) !important;
        }

        .location-option:hover {
            background-color: #eff6ff;
        }

        .location-option input[type="checkbox"]:checked+div {
            color: #2563eb;
        }

        /* Dropdown animation */
        .dropdown-enter {
            opacity: 0;
            transform: translateY(-10px);
        }

        .dropdown-enter-active {
            opacity: 1;
            transform: translateY(0);
            transition: all 0.2s ease-in-out;
        }

        .dropdown-exit {
            opacity: 1;
        }

        .dropdown-exit-active {
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.2s ease-in-out;
        }
    </style>
@endsection

@section('content')
    <div class="w-[100%]  overflow-y-auto bg-white-100">
        <!-- Quotation Header -->
        <div class="bg-gray-50 p-4 mb-4 rounded">
            <h1 class="text-xl font-bold text-[#2679b5]">Quotation Name: {{ $quotation->name }}</h1>
            @if ($quotation->client_name)
                <p class="text-gray-600">Client Name: {{ $quotation->client_name }}</p>
            @endif
        </div>

        <!-- Location Selection Interface -->
        <div class="bg-white p-4 mb-6 rounded border">
            <h3 class="text-lg font-semibold text-[#2679b5] mb-4">Select Locations for this Quotation</h3>

            <!-- Multi-Select Dropdown -->
            <div id="locationMultiSelect" class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Choose Locations:</label>

                <!-- Search Input -->
                <div class="relative">
                    <input type="text"
                        class="location-search w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Search or select locations...">

                    <!-- Dropdown -->
                    <div
                        class="location-dropdown absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg hidden max-h-64 overflow-y-auto">
                        <!-- Location Options -->
                        <div class="location-options py-1">
                            @foreach ($locations as $location)
                                <label class="location-option flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer"
                                    data-location-id="{{ $location->id }}" data-name="{{ $location->name }}"
                                    data-address="{{ $location->address }}">

                                    <div class="flex-1">


                                        <div class="font-medium text-sm text-gray-900"><input
                                                type="checkbox"value="{{ $location->id }}"
                                                class="mr-3 text-blue-600 focus:ring-blue-500"> {{ $location->name }}</div>
                                        <div class="text-xs text-gray-500">{{ $location->address }}</div>
                                    </div>
                                </label>
                            @endforeach
                        </div>
                    </div>

                    <!-- Selected Locations Pills -->
                    <div class="mt-3">
                        <div class="flex justify-between items-center mb-2">
                            <label class="block text-sm font-medium text-gray-700">Selected Locations:</label>
                            <div class="flex gap-2">
                                <button type="button" id="selectAllLocationsBtn"
                                    class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition duration-200">
                                    Select All
                                </button>
                                <button type="button" id="deselectAllLocationsBtn"
                                    class="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition duration-200">
                                    Deselect All
                                </button>
                            </div>
                        </div>
                        <div class="selected-pills flex flex-wrap gap-2 min-h-[50px] p-3 border border-gray-200 rounded-lg bg-gray-50"
                            style="align-items: flex-start;">
                            <span class="text-gray-400 text-sm italic">No locations selected</span>
                        </div>
                    </div>
                </div>

                <!-- Summary -->
                <div class="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    <span id="selectedLocationCount">0</span> of {{ $locations->count() }} locations selected
                </div>
            </div>
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

            <form id="mainLocationsForm" class="space-y-6" method="POST" action="{{ route('home.step2.submit') }}">
                @csrf
                <!-- Hidden form for step2.js compatibility -->
                <form id="step2Form" style="display: none;"></form>
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h2 class="text-2xl text-[#2679b5]">Selected Locations:</h2>
                        <p class="text-sm text-gray-600" id="locationStatusMessage">Select locations above to configure
                            shifts
                        </p>
                    </div>
                    <div class="flex gap-4">

                        <button type="button" id="exportBtn"
                            class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded border">
                            <i class="fas fa-download mr-1"></i> Export Options
                        </button>
                        <button type="button" id="backToSelectionBtn"
                            class="bg-[#428bca] hover:bg-blue-600 text-white px-3 py-2 rounded border">
                            Add/Edit Location
                        </button>
                        <button type="button" id="openShiftTypeCrudBtn"
                            class="bg-[#87b87f] hover:bg-lime-700 text-white px-3 py-2 rounded border">
                            Add/Edit Shift Types
                        </button>
                        <a href="{{ route('quotation.index') }}"
                            class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded">
                            Back to Quotations
                        </a>
                    </div>
                </div>

                <!-- Locations Container -->
                <div id="locationsContainer">
                    @foreach ($locations as $location)
                        <div class="border border-gray-300 rounded mt-2 mb-6 bg-gray-100 location-form"
                            data-location-id="{{ $location->id }}" style="display: none;">
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
                                            <select id="filterShiftType_{{ $location->id }}"
                                                class="border rounded px-2 py-1">
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
                                            <select id="batchShiftType_{{ $location->id }}"
                                                class="border rounded px-2 py-1 w-full">
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
                                        <select id="batchDays_{{ $location->id }}"
                                            class="border rounded px-2 py-1 w-full" multiple size="7"></select>
                                    </div>
                                </div>

                                <!-- Modal Actions -->
                                <div class="flex justify-end mt-4">
                                    <button type="button" id="cancelBatchFormBtn_{{ $location->id }}"
                                        class="bg-gray-500 text-white px-4 py-2 rounded mr-2">Cancel</button>
                                    <button type="button" id="saveBatchFormBtn_{{ $location->id }}"
                                        class="bg-[#87b87f] hover:bg-lime-700 text-white px-4 py-2 rounded">Save and review
                                        <i class="fa-solid fa-arrow-right ml-1"></i></button>
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

            <!-- Export Options Modal -->
            <div id="exportModal"
                class="hidden fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-[#2679b5]">Export Timesheet Options</h3>
                        <button type="button" id="closeExportModal" class="text-gray-500 hover:text-gray-700 text-xl">
                            &times;
                        </button>
                    </div>

                    <div class="space-y-6">
                        <!-- Export Type Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-3">Export Type:</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="radio" name="exportType" value="all" class="mr-2" checked>
                                    <span>Export All Locations</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="exportType" value="specific" class="mr-2">
                                    <span>Export Specific Locations</span>
                                </label>
                            </div>
                        </div>

                        <!-- Format Options for All Locations -->
                        <div id="allLocationsOptions" class="border-l-4 border-blue-500 pl-4">
                            <label class="block text-sm font-medium text-gray-700 mb-3">Format for All Locations:</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="radio" name="allLocationsFormat" value="single" class="mr-2"
                                        checked>
                                    <span>All in One Page</span>
                                    <span class="text-xs text-gray-500 ml-2">(Single document with all locations)</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="radio" name="allLocationsFormat" value="separate" class="mr-2">
                                    <span>Separate Pages</span>
                                    <span class="text-xs text-gray-500 ml-2">(Different pagination for each
                                        location)</span>
                                </label>
                            </div>
                        </div>

                        <!-- Specific Locations Selection -->
                        <div id="specificLocationsOptions" class="border-l-4 border-green-500 pl-4 hidden">
                            <label class="block text-sm font-medium text-gray-700 mb-3">Select Locations with Saved
                                Shifts:</label>
                            <div id="availableLocationsContainer" class="space-y-2 max-h-48 overflow-y-auto">
                                <!-- Will be populated by JavaScript -->
                            </div>
                            <p class="text-xs text-gray-500 mt-2">Only locations with saved shift data are available for
                                export.</p>
                        </div>
                        <!-- Modal Actions -->
                        <div class="flex justify-end mt-6 space-x-2">
                            <button type="button" id="cancelExportBtn"
                                class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                                Cancel
                            </button>
                            <button type="button" id="processExportBtn"
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                                <i class="fas fa-download mr-1"></i>
                                Export
                            </button>
                        </div>
                    </div>
                </div>

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
                                <button type="button"
                                    class="bg-gray-500 text-white px-4 py-2 rounded mr-2">Cancel</button>
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
                        <button id="confirmSelectShiftBtn"
                            class="bg-blue-600 text-white px-4 py-2 rounded">Confirm</button>
                    </div>
                </div>
            </div>
            <!-- Preview Modal -->
            <div id="previewModal"
                class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden  ">
                <div class="bg-white rounded-lg shadow-lg w-[70%] p-6 relative overflow-y-auto max-h-[95vh]">
                    <button type="button" id="closePreviewModal"
                        class="absolute top-1 right-2 text-gray-500 hover:text-red-600 text-2xl">&times;</button>
                    <h2 class="text-2xl  text-[#2679b5] mb-4">Timesheet Preview</h2>

                    <!-- Column Visibility Custom Dropdown -->
                    <div class="mb-6 p-4 border rounded bg-gray-50 column-visibility-dropdown">
                        <h3 class="text-lg font-semibold mb-4">Column Visibility</h3>
                        <div class="relative w-full">
                            <button id="columnDropdownBtn" type="button"
                                class="w-full bg-white border-2 border-blue-400 rounded-lg px-4 py-2 text-left flex justify-between items-center shadow-sm focus:outline-none">
                                <span id="columnDropdownText">Select Columns</span>
                                <svg class="w-4 h-4 ml-2 text-blue-500" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7" />
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


                    <div class="overflow-x-auto ">
                        <table id="previewTable" class="display  w-full table-fixed">
                            <thead id="previewTableHead1"></thead>
                            <tbody id="previewTableBody1"></tbody>
                        </table>
                    </div>

                    <div id="exportBTN"></div>

                </div>
            </div>
            <!-- Location CRUD Modal -->
            <div id="locationCrudModal"
                class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-lg shadow-lg w-[90%] max-w-3xl p-6 relative">
                    <button type="button" id="closeLocationCrudModal"
                        class="absolute top-2 right-4 text-gray-500 hover:text-red-600 text-2xl">&times;</button>
                    <h2 class="text-2xl  text-[#2679b5] mb-4">Manage Locations</h2>
                    <div class="flex justify-end mb-2">
                        <button id="addLocationBtn" class="bg-blue-600 text-white px-4 py-2 rounded">Add Location</button>
                    </div>
                    <table id="locationCrudTable" class="min-w-full border">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border px-2 py-1">Name</th>
                                <th class="border px-2 py-1">Address</th>
                                <th class="border px-2 py-1">City</th>
                                <th class="border px-2 py-1">State</th>
                                <th class="border px-2 py-1">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Rows will be rendered by JS -->
                        </tbody>
                    </table>
                </div>
            </div>
            <!-- Loading Overlay -->
            <div id="globalLoadingOverlay"
                class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999] hidden">
                <div class="bg-white rounded-full p-6 shadow-lg flex flex-col items-center">
                    <svg class="animate-spin h-8 w-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg"
                        fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                            stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <span class="text-blue-600 font-semibold">Loading...</span>
                </div>
            </div>

            <!-- Shift Types CRUD Modal -->
            <div id="shiftTypeCrudModal"
                class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
                <div class="bg-white rounded-lg shadow-lg w-[90%] max-w-3xl p-6 relative">
                    <button type="button" id="closeShiftTypeCrudModal"
                        class="absolute top-2 right-4 text-gray-500 hover:text-red-600 text-2xl">&times;</button>
                    <h2 class="text-2xl text-[#2679b5] mb-4">Manage Shift Types</h2>
                    <div class="flex justify-end mb-2">
                        <button id="addShiftTypeBtn" class="bg-blue-600 text-white px-4 py-2 rounded">Add Shift
                            Type</button>
                    </div>
                    <table id="shiftTypeCrudTable" class="min-w-full border">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="border px-2 py-1">Name</th>
                                <th class="border px-2 py-1">Description</th>
                                <th class="border px-2 py-1">Day Rate</th>
                                <th class="border px-2 py-1">Night Rate</th>
                                <th class="border px-2 py-1">Saturday Rate</th>
                                <th class="border px-2 py-1">Sunday Rate</th>
                                <th class="border px-2 py-1">PH Rate</th>
                                <th class="border px-2 py-1">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Rows will be rendered by JS -->
                        </tbody>
                    </table>
                </div>
            </div>



            <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
            <script>
                // Set quotation ID globally
                window.quotationId = @json($quotation->id);




                // Simplified Location Selection and Display Logic
                document.addEventListener('DOMContentLoaded', function() {
                    const locations = @json($locations);
                    const quotationId = @json($quotation->id);
                    const savedLocationSchedules = @json($savedLocationSchedules ?? []);

                    let selectedLocationIds = [];

                    // Initialize multiSelect dropdown
                    const initializeDropdown = () => {
                        console.log('Attempting to initialize dropdown, MultiSelectDropdown available:', !!window
                            .MultiSelectDropdown);
                        if (window.MultiSelectDropdown) {
                            console.log('Creating new MultiSelectDropdown instance');
                            window.multiSelectDropdown = new window.MultiSelectDropdown('locationMultiSelect');
                            // Load saved selections after dropdown is initialized
                            setTimeout(loadSavedSelections, 100);
                            return true;
                        } else {
                            console.log('MultiSelectDropdown class not yet available');
                            return false;
                        }
                    };

                    if (!initializeDropdown()) {
                        console.log('Waiting for MultiSelectDropdown class to be available');
                        // Wait for the class to be available
                        const waitForDropdown = () => {
                            if (!initializeDropdown()) {
                                setTimeout(waitForDropdown, 100);
                            }
                        };
                        waitForDropdown();
                    }

                    // Initialize functionality
                    initLocationSelection();
                    loadSavedShiftData();
                    // initializeExportModal();

                    // // Initialize export modal functionality
                    // function initializeExportModal() {
                    //     const exportBtn = document.getElementById('exportBtn');
                    //     const exportModal = document.getElementById('exportModal');
                    //     const closeExportModal = document.getElementById('closeExportModal');
                    //     const cancelExportBtn = document.getElementById('cancelExportBtn');
                    //     const processExportBtn = document.getElementById('processExportBtn');

                    //     // Export type radio buttons
                    //     const exportTypeRadios = document.querySelectorAll('input[name="exportType"]');
                    //     const allLocationsOptions = document.getElementById('allLocationsOptions');
                    //     const specificLocationsOptions = document.getElementById('specificLocationsOptions');

                    //     console.log('Initializing export modal...', {
                    //         exportBtn: !!exportBtn,
                    //         exportModal: !!exportModal,
                    //         closeExportModal: !!closeExportModal,
                    //         cancelExportBtn: !!cancelExportBtn,
                    //         processExportBtn: !!processExportBtn
                    //     });

                    //     // Open export modal
                    //     if (exportBtn) {
                    //         exportBtn.addEventListener('click', function() {
                    //             console.log('Export button clicked - opening modal');
                    //             updateAvailableLocations();
                    //             exportModal.classList.remove('hidden');
                    //             document.body.style.overflow = 'hidden'; // Prevent background scrolling
                    //         });
                    //     }

                    //     // Close export modal function
                    //     function closeModal() {
                    //         console.log('Closing export modal');
                    //         exportModal.classList.add('hidden');
                    //         document.body.style.overflow = 'auto'; // Restore scrolling
                    //     }

                    //     // Close modal event listeners
                    //     if (closeExportModal) {
                    //         closeExportModal.addEventListener('click', closeModal);
                    //     }
                    //     if (cancelExportBtn) {
                    //         cancelExportBtn.addEventListener('click', closeModal);
                    //     }

                    //     // Close modal on backdrop click
                    //     if (exportModal) {
                    //         exportModal.addEventListener('click', function(e) {
                    //             if (e.target === exportModal) {
                    //                 closeModal();
                    //             }
                    //         });
                    //     }

                    //     // Close modal on ESC key
                    //     document.addEventListener('keydown', function(e) {
                    //         if (e.key === 'Escape' && !exportModal.classList.contains('hidden')) {
                    //             closeModal();
                    //         }
                    //     });

                    //     // Handle export type change
                    //     exportTypeRadios.forEach(radio => {
                    //         radio.addEventListener('change', function() {
                    //             console.log('Export type changed to:', this.value);
                    //             if (this.value === 'all') {
                    //                 allLocationsOptions.classList.remove('hidden');
                    //                 specificLocationsOptions.classList.add('hidden');
                    //             } else {
                    //                 allLocationsOptions.classList.add('hidden');
                    //                 specificLocationsOptions.classList.remove('hidden');
                    //             }
                    //         });
                    //     });

                    //     // Process export (placeholder for now)
                    //     if (processExportBtn) {
                    //         processExportBtn.addEventListener('click', function() {
                    //             console.log('Process export clicked - functionality to be implemented');
                    //             alert('Export functionality will be implemented here!');
                    //             // closeModal(); // Uncomment this when actual export is implemented
                    //         });
                    //     }
                    // }

                    // function updateAvailableLocations() {
                    //     const container = document.getElementById('availableLocationsContainer');
                    //     if (!container) {
                    //         console.log('Available locations container not found');
                    //         return;
                    //     }

                    //     container.innerHTML = '';

                    //     // Get locations that have saved shift data
                    //     const locationsWithData = getLocationsWithShiftData();
                    //     console.log('Locations with data:', locationsWithData);

                    //     if (locationsWithData.length === 0) {
                    //         container.innerHTML = '<p class="text-sm text-gray-500">No locations with saved shift data found.</p>';
                    //         return;
                    //     }

                    //     locationsWithData.forEach(location => {
                    //         const div = document.createElement('div');
                    //         div.className = 'flex items-center justify-between p-2 border rounded';

                    //         // Use the record count from the enhanced getLocationsWithShiftData function
                    //         const recordCount = location.recordCount || 0;

                    //         div.innerHTML = `
        //             <label class="flex items-center flex-1">
        //                 <input type="checkbox" name="specificLocations" value="${location.id}" class="mr-2">
        //                 <div>
        //                     <span class="font-medium">${location.name}</span>
        //                     <div class="text-xs text-gray-500">${location.address}</div>
        //                 </div>
        //             </label>
        //             <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
        //                 ${recordCount} shift${recordCount !== 1 ? 's' : ''}
        //             </span>
        //         `;

                    //         container.appendChild(div);
                    //     });
                    // }

                    // function getLocationsWithShiftData() {
                    //     const locationsWithData = [];

                    //     locations.forEach(location => {
                    //         let recordCount = 0;
                    //         let hasData = false;
                    //         let dataSource = '';

                    //         // ONLY check localStorage - ignore window.records completely
                    //         const quotationId = window.quotationId;
                    //         const possibleKeys = [
                    //             `quotation${quotationId}_location_${location.id}_records`,
                    //             `records_${location.id}`,
                    //             `quotation${quotationId}selectedlocation${location.id}Records`,
                    //             `quotation_${quotationId}selectedlocations${location.id}Records`, // Primary pattern
                    //             `quotation_${quotationId}_selectedlocations${location.id}Records`,
                    //             `quotation${quotationId}_selectedlocations${location.id}Records`
                    //         ];

                    //         // Check only localStorage keys
                    //         for (const key of possibleKeys) {
                    //             const savedRecords = localStorage.getItem(key);
                    //             if (savedRecords) {
                    //                 try {
                    //                     const parsedRecords = JSON.parse(savedRecords);
                    //                     console.log(`Checking localStorage key: ${key}`, {
                    //                         isArray: Array.isArray(parsedRecords),
                    //                         length: Array.isArray(parsedRecords) ? parsedRecords.length : 'N/A',
                    //                         data: parsedRecords
                    //                     });

                    //                     // Only include if localStorage has valid, non-empty array
                    //                     if (Array.isArray(parsedRecords) && parsedRecords.length > 0) {
                    //                         recordCount = parsedRecords.length;
                    //                         hasData = true;
                    //                         dataSource = `localStorage[${key}]`;
                    //                         console.log(`   Found ${recordCount} valid records for location ${location.name} in ${key}`);
                    //                         break; // Found valid data, stop checking other keys
                    //                     } else if (Array.isArray(parsedRecords) && parsedRecords.length === 0) {
                    //                         console.log(`  Found empty array for location ${location.name} in ${key} - excluding from export`);
                    //                         dataSource = `localStorage[${key}] (empty)`;
                    //                         // Continue checking other keys in case there's valid data elsewhere
                    //                     } else {
                    //                         console.log(`  Invalid data format for location ${location.name} in ${key}`);
                    //                     }
                    //                 } catch (e) {
                    //                     console.error(`Error parsing localStorage key ${key}:`, e);
                    //                 }
                    //             }
                    //         }

                    //         // Add location only if localStorage has valid data
                    //         if (hasData) {
                    //             console.log(`   Including location ${location.name} in export (${recordCount} shifts from ${dataSource})`);
                    //             locationsWithData.push({
                    //                 ...location,
                    //                 recordCount: recordCount
                    //             });
                    //         } else {
                    //             console.log(`  Excluding location ${location.name} from export (no valid localStorage data found)`);
                    //         }
                    //     });

                    //     console.log('Final locations with localStorage data:', locationsWithData.map(loc => ({
                    //         name: loc.name, 
                    //         recordCount: loc.recordCount
                    //     })));

                    //     return locationsWithData;
                    // }

                    // Testing function to check localStorage for saved records (can be called from browser console)
                    // function debugLocationRecords() {
                    //     console.log('=== DEBUGGING LOCATION RECORDS (localStorage ONLY) ===');
                    //     const quotationId = window.quotationId;
                    //     console.log('Current quotation ID:', quotationId);

                    //     locations.forEach(location => {
                    //                 console.log(`\n--- Location: ${location.name} (ID: ${location.id}) ---`);

                    //                 // ONLY check localStorage - ignore window.records
                    //                 const possibleKeys = [
                    //                     `quotation${quotationId}_location_${location.id}_records`,
                    //                     `records_${location.id}`,
                    //                     `quotation${quotationId}selectedlocation${location.id}Records`,
                    //                     `quotation_${quotationId}selectedlocations${location.id}Records`, // Primary pattern
                    //                     `quotation_${quotationId}_selectedlocations${location.id}Records`,
                    //                     `quotation${quotationId}_selectedlocations${location.id}Records`
                    //                 ];

                    //                 let foundInLocalStorage = false;
                    //                 possibleKeys.forEach(key => {
                    //                             const savedData = localStorage.getItem(key);
                    //                             if (savedData) {
                    //                                 try {
                    //                                     const parsed = JSON.parse(savedData);
                    //                                     //                     if (Array.isArray(parsed) && parsed.length > 0) {
                    //                                     //                         console.log(
                    //                                     //                             `   Found in localStorage[${key}]: ${parsed.length} records`
                    //                                     //                             );
                    //                                     //                         foundInLocalStorage = true;
                    //                                     //                     } else if (Array.isArray(parsed) && parsed.length === 0) {
                    //                                     //                         console.log(
                    //                                     //                             `Found EMPTY array in localStorage[${key}] - will be excluded from export`
                    //                                     //                             );
                    //                                     //                     } else {
                    //                                     //                         console.log(
                    //                                     //                             `Found in localStorage[${key}] but invalid format (not an array)`
                    //                                     //                             );
                    //                                     //                     }
                    //                                     //                 } catch (e) {
                    //                                     //                     console.log(
                    //                                     //                         `Found in localStorage[${key}] but invalid JSON: ${e.message}`
                    //                                     //                         );
                    //                                     //                 }
                    //                                     //             }
                    //                                     //         });

                    //                                     //         if (!foundInLocalStorage) {
                    //                                     //             console.log('  No valid data found in localStorage');
                    //                                     //         }
                    //                                     //     });

                    //                                     //     console.log('\n=== FINAL RESULT (localStorage ONLY) ===');
                    //                                     //     const detectedLocations = getLocationsWithShiftData();
                    //                                     //     console.log('Detected locations with localStorage data:', detectedLocations.map(loc => ({
                    //                                     //         name: loc.name,
                    //                                     //         id: loc.id,
                    //                                     //         recordCount: loc.recordCount
                    //                                     //     })));
                    //                                     // }

                    //                                     // Make debug function available globally
                    //                                     window.debugLocationRecords = debugLocationRecords;

                    //                                     // Quick test function for your specific localStorage key
                    //                                     function testSpecificKey() {
                    //                                         const quotationId = window.quotationId ||
                    //                                         16; // Default to 16 if not set
                    //                                         const testKey =
                    //                                             `quotation_${quotationId}selectedlocations1Records`;
                    //                                         console.log('Testing specific localStorage key:', testKey);

                    //                                         const data = localStorage.getItem(testKey);
                    //                                         if (data) {
                    //                                             try {
                    //                                                 const parsed = JSON.parse(data);
                    //                                                 console.log('   Found data:', {
                    //                                                     key: testKey,
                    //                                                     recordCount: Array.isArray(parsed) ? parsed
                    //                                                         .length : 'Not an array',
                    //                                                     firstRecord: parsed[0] || 'No records'
                    //                                                 });
                    //                                             } catch (e) {
                    //                                                 console.log('  Invalid JSON in localStorage key:',
                    //                                                     testKey);
                    //                                             }
                    //                                         } else {
                    //                                             console.log('  No data found in localStorage key:',
                    //                                             testKey);
                    //                                         }

                    //                                         // Also test the detection function
                    //                                         console.log('\n--- Testing detection function ---');
                    //                                         const detectedLocations = getLocationsWithShiftData();
                    //                                         console.log('Detected locations:', detectedLocations);
                    //                                     }

                    //                                     window.testSpecificKey = testSpecificKey;

                    //                                     // Test function specifically for empty array scenarios
                    //                                     function testEmptyArrayScenario() {
                    //                                         console.log('=== TESTING EMPTY ARRAY SCENARIO ===');
                    //                                         const quotationId = window.quotationId ||
                    //                                         17; // Test with quotation 17

                    //                                         // Test the specific keys mentioned by user
                    //                                         const testKeys = [
                    //                                             `quotation${quotationId}_selected_locations`,
                    //                                             `quotation_${quotationId}selectedlocations1Records`
                    //                                         ];

                    //                                         testKeys.forEach(key => {
                    //                                             const data = localStorage.getItem(key);
                    //                                             console.log(`\nTesting key: ${key}`);
                    //                                             if (data) {
                    //                                                 try {
                    //                                                     const parsed = JSON.parse(data);
                    //                                                     console.log('Raw data:', data);
                    //                                                     console.log('Parsed data:', parsed);
                    //                                                     console.log('Is array:', Array.isArray(
                    //                                                         parsed));
                    //                                                     console.log('Length:', Array.isArray(
                    //                                                         parsed) ? parsed.length : 'N/A');
                    //                                                     console.log('Should be included in export:',
                    //                                                         Array.isArray(parsed) && parsed
                    //                                                         .length > 0 ? 'YES' : 'NO');
                    //                                                 } catch (e) {
                    //                                                     console.log('Invalid JSON:', e.message);
                    //                                                 }
                    //                                             } else {
                    //                                                 console.log('Key not found in localStorage');
                    //                                             }
                    //                                         });

                    //                                         console.log('\n--- Detection result ---');
                    //                                         const detectedLocations = getLocationsWithShiftData();
                    //                                         console.log('Locations that will appear in export:',
                    //                                             detectedLocations);
                    //                                     }

                    //                                     window.testEmptyArrayScenario = testEmptyArrayScenario;

                    //                                     // Function to refresh export modal data (localStorage only)
                    //                                     function refreshExportData() {
                    //                                         console.log(
                    //                                             '=== REFRESHING EXPORT DATA (localStorage ONLY) ===');

                    //                                         // Re-detect locations from localStorage only
                    //                                         const detectedLocations = getLocationsWithShiftData();
                    //                                         console.log('Refreshed detection result from localStorage:',
                    //                                             detectedLocations);

                    //                                         // Update the export modal if it's open
                    //                                         const exportModal = document.getElementById('exportModal');
                    //                                         if (exportModal && !exportModal.classList.contains('hidden')) {
                    //                                             console.log(
                    //                                                 'Export modal is open, updating location list...');
                    //                                             updateAvailableLocations();
                    //                                         }

                    //                                         return detectedLocations;
                    //                                     }

                    //                                     window.refreshExportData = refreshExportData;

                    // Function to test localStorage data directly
                    // function testLocalStorageData() {
                    //     console.log('=== TESTING localStorage DATA DIRECTLY ===');
                    //     const quotationId = window.quotationId;

                    //     locations.forEach(location => {
                    //         const primaryKey =
                    //             `quotation_${quotationId}selectedlocations${location.id}Records`;
                    //         const data = localStorage.getItem(primaryKey);

                    //         console.log(
                    //             `\nLocation: ${location.name} (ID: ${location.id})`
                    //             );
                    //         console.log(`Primary key: ${primaryKey}`);

                    //         if (data) {
                    //             try {
                    //                 const parsed = JSON.parse(data);
                    //                 console.log(
                    //                     `Data: ${JSON.stringify(parsed)}`);
                    //                 console.log(
                    //                     `Type: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`
                    //                     );
                    //                 console.log(
                    //                     `Length: ${Array.isArray(parsed) ? parsed.length : 'N/A'}`
                    //                     );
                    //                 console.log(
                    //                     `Will be included in export: ${Array.isArray(parsed) && parsed.length > 0 ? 'YES' : 'NO'}`
                    //                 );
                    //             } catch (e) {
                    //                 console.log(`Invalid JSON: ${e.message}`);
                    //                 console.log(
                    //                     'Will be included in export: NO');
                    //             }
                    //         } else {
                    //             console.log('No data found');
                    //             console.log('Will be included in export: NO');
                    //         }
                    //     });
                    // }

                    // window.testLocalStorageData = testLocalStorageData;

                    function initLocationSelection() {
                        if (typeof MultiSelectDropdown !== 'undefined') {
                            console.log('Initializing MultiSelectDropdown...');
                            window.multiSelectDropdown = new MultiSelectDropdown(
                                'locationMultiSelect');

                            // Load saved selections after initialization
                            setTimeout(loadSavedSelections, 100);

                            // Add event listeners for Select All and Deselect All buttons
                            const selectAllBtn = document.getElementById(
                                'selectAllLocationsBtn');
                            const deselectAllBtn = document.getElementById(
                                'deselectAllLocationsBtn');

                            console.log('Select All Button:', selectAllBtn);
                            console.log('Deselect All Button:', deselectAllBtn);

                            // Select All Locations button
                            if (selectAllBtn) {
                                selectAllBtn.addEventListener('click', function() {
                                    console.log('Select All button clicked');
                                    console.log(
                                        'multiSelectDropdown available:', !!
                                        window.multiSelectDropdown);
                                    console.log(
                                        'multiSelectDropdown.selectAll method:',
                                        typeof window
                                        .multiSelectDropdown?.selectAll);
                                    if (window.multiSelectDropdown &&
                                        typeof window.multiSelectDropdown
                                        .selectAll === 'function') {
                                        window.multiSelectDropdown.selectAll();
                                    } else {
                                        console.error(
                                            'multiSelectDropdown or selectAll method not available'
                                        );
                                    }
                                });
                                console.log('Select All event listener attached');
                            } else {
                                console.error('Select All button not found');
                            }

                            // Deselect All Locations button
                            if (deselectAllBtn) {
                                deselectAllBtn.addEventListener('click', function() {
                                    console.log('Deselect All button clicked');
                                    console.log(
                                        'multiSelectDropdown available:', !!
                                        window.multiSelectDropdown);
                                    console.log(
                                        'multiSelectDropdown.deselectAll method:',
                                        typeof window
                                        .multiSelectDropdown?.deselectAll);
                                    if (window.multiSelectDropdown &&
                                        typeof window.multiSelectDropdown
                                        .deselectAll === 'function') {
                                        window.multiSelectDropdown
                                            .deselectAll();
                                    } else {
                                        console.error(
                                            'multiSelectDropdown or deselectAll method not available'
                                        );
                                    }
                                });
                                console.log('Deselect All event listener attached');
                            } else {
                                console.error('Deselect All button not found');
                            }

                            // Save All Locations button
                            const saveAllBtn = document.getElementById(
                                'saveAllLocationsBtn');
                            if (saveAllBtn) {
                                saveAllBtn.addEventListener('click', function(e) {
                                    e.preventDefault();

                                    // Get selected locations from multiSelect dropdown
                                    const selectedLocationIds = window
                                        .multiSelectDropdown
                                        .getSelectedValues();
                                    let savePromises = [];

                                    selectedLocationIds.forEach(locationId => {
                                        if (window.records && window
                                            .records[locationId] &&
                                            window.records[
                                                locationId].length > 0
                                        ) {
                                            savePromises.push(
                                                new Promise((
                                                    resolve) => {
                                                    if (typeof window
                                                        .saveShiftDataToDatabase ===
                                                        'function'
                                                    ) {
                                                        window
                                                            .saveShiftDataToDatabase(
                                                                locationId,
                                                                window
                                                                .records[
                                                                    locationId
                                                                ]
                                                            );
                                                    }
                                                    resolve();
                                                })
                                            );
                                        }
                                    });

                                    // Wait for all saves to complete, then submit the form
                                    Promise.all(savePromises).then(() => {
                                        console.log(
                                            'All location data saved. Submitting form...'
                                        );
                                        document.getElementById(
                                                'mainLocationsForm')
                                            .submit();
                                    }).catch((error) => {
                                        console.error(
                                            'Error saving location data:',
                                            error);
                                        // Submit anyway
                                        document.getElementById(
                                                'mainLocationsForm')
                                            .submit();
                                    });
                                });
                            }
                        } else {
                            console.error('MultiSelectDropdown class not found');
                        }

                        // Global test function for debugging
                        window.testButtons = function() {
                            console.log('=== Testing Select/Deselect Buttons ===');
                            console.log('MultiSelectDropdown available:', !!window
                                .multiSelectDropdown);
                            console.log('MultiSelectDropdown methods:');
                            if (window.multiSelectDropdown) {
                                console.log('- selectAll:', typeof window
                                    .multiSelectDropdown.selectAll);
                                console.log('- deselectAll:', typeof window
                                    .multiSelectDropdown.deselectAll);
                                console.log('- selectedValues:', window
                                    .multiSelectDropdown.selectedValues);
                            }

                            const selectAllBtn = document.getElementById(
                                'selectAllLocationsBtn');
                            const deselectAllBtn = document.getElementById(
                                'deselectAllLocationsBtn');

                            console.log('Select All Button found:', !!selectAllBtn);
                            console.log('Deselect All Button found:', !!
                                deselectAllBtn);

                            if (selectAllBtn && window.multiSelectDropdown) {
                                console.log('Testing selectAll...');
                                window.multiSelectDropdown.selectAll();
                            }
                        };

                        // Make test functions globally available
                        window.testSelectAll = function() {
                            if (window.multiSelectDropdown) {
                                console.log('Manually testing selectAll');
                                window.multiSelectDropdown.selectAll();
                            } else {
                                console.error('multiSelectDropdown not available');
                            }
                        };

                        window.testDeselectAll = function() {
                            if (window.multiSelectDropdown) {
                                console.log('Manually testing deselectAll');
                                window.multiSelectDropdown.deselectAll();
                            } else {
                                console.error('multiSelectDropdown not available');
                            }
                        };
                    }


                    // Load saved shift data from database
                    function loadSavedShiftData() {
                        console.log('Loading saved shift data...',
                            savedLocationSchedules);

                        savedLocationSchedules.forEach(schedule => {
                            const locationId = schedule.location_id;
                            const shiftDetails = schedule.shift_details;

                            if (shiftDetails && Array.isArray(shiftDetails) &&
                                shiftDetails.length > 0) {
                                console.log(
                                    `Loading ${shiftDetails.length} shift records for location ${locationId}`
                                );

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
                                // localStorage.setItem(`records_${locationId}`, JSON.stringify(shiftDetails));

                                // If the location form is visible, render the table
                                const locationForm = document.querySelector(
                                    `[data-location-id="${locationId}"]`);
                                if (locationForm && locationForm.style
                                    .display !== 'none') {
                                    if (typeof window.renderTable ===
                                        'function') {
                                        window.renderTable(locationId);
                                    }
                                }
                            }
                        });
                    }

                    // Save shift data to database
                    function saveShiftDataToDatabase(locationId, shiftData) {
                        const csrfToken = document.querySelector(
                            'meta[name="csrf-token"]');
                        if (!csrfToken) {
                            console.error('CSRF token not found');
                            return;
                        }

                        fetch('/save-location-shift-data', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': csrfToken.getAttribute(
                                        'content')
                                },
                                body: JSON.stringify({
                                    location_id: locationId,
                                    shift_data: shiftData
                                })
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    console.log(
                                        'Shift data saved successfully for location:',
                                        locationId);
                                } else {
                                    console.error('Failed to save shift data:', data
                                        .message);
                                }
                            })
                            .catch(error => {
                                console.error('Error saving shift data:', error);
                            });
                    }

                    // Update location display based on multiSelect selections
                    function updateLocationDisplay() {
                        const quotationId = window.quotationId;

                        if (!window.multiSelectDropdown) {
                            console.warn('MultiSelectDropdown not initialized');
                            return;
                        }
                        const selectedLocationIds = window.multiSelectDropdown
                            .getSelectedValues();
                        console.log('Updating location display...');


                        console.log('Selected location IDs:',
                            selectedLocationIds); // Debug log

                        // Update the count display
                        const countDisplay = document.getElementById(
                            'selectedLocationCount');
                        if (countDisplay) {
                            countDisplay.textContent = selectedLocationIds.length;
                        }

                        // Update status message
                        const statusMessage = document.getElementById(
                            'locationStatusMessage');
                        if (statusMessage) {
                            if (selectedLocationIds.length === 0) {
                                statusMessage.textContent =
                                    'Select locations above to configure shifts';
                            } else {
                                statusMessage.textContent =
                                    `${selectedLocationIds.length} location(s) selected - Configure shifts below`;
                            }
                        }

                        // Show/hide location forms based on selection
                        const locationForms = document.querySelectorAll(
                            '.location-form');
                        locationForms.forEach(form => {
                            const locationId = form.getAttribute(
                                'data-location-id');
                            if (selectedLocationIds.includes(locationId)) {
                                form.style.display = 'block';

                                // Load saved data for this location if it exists and not already loaded
                                if (window.records && !window.records[
                                        locationId]) {
                                    const schedule = savedLocationSchedules
                                        .find(s => s.location_id == locationId);
                                    if (schedule && schedule.shift_details) {
                                        window.records[locationId] = schedule
                                            .shift_details;
                                        localStorage.setItem(
                                            `records_${locationId}`, JSON
                                            .stringify(schedule
                                                .shift_details));

                                        // Render table if renderTable function is available
                                        if (typeof window.renderTable ===
                                            'function') {
                                            window.renderTable(locationId);
                                        }
                                    }
                                }

                                // Also try to load using the step2.js function
                                if (typeof window.loadRecordsForLocation ===
                                    'function') {
                                    window.loadRecordsForLocation(locationId);
                                }
                            } else {
                                form.style.display = 'none';
                            }
                        });

                        // Update hidden input
                        const selectedLocationsInput = document.getElementById(
                            'selectedLocationsInput');
                        if (selectedLocationsInput) {
                            selectedLocationsInput.value = JSON.stringify(
                                selectedLocationIds);
                        }

                        // Save to localStorage with quotation-specific key (centralized save location)
                        localStorage.setItem(
                            `quotation${quotationId}_selected_locations`, JSON
                            .stringify(
                                selectedLocationIds));
                    }

                    // Make functions globally available
                    window.updateLocationDisplay = updateLocationDisplay;
                    window.saveShiftDataToDatabase = saveShiftDataToDatabase;

                    // function loadSavedSelections() {
                    //     // First try to load from saved schedules (database)
                    //     if (savedLocationSchedules && savedLocationSchedules.length > 0) {
                    //         savedLocationSchedules.forEach(schedule => {
                    //             // Select the location in multiSelect dropdown
                    //             if (window.multiSelectDropdown) {
                    //                 const checkbox = document.querySelector(`#locationMultiSelect input[value="${schedule.location_id}"]`);
                    //                 if (checkbox) {
                    //                     checkbox.checked = true;
                    //                     window.multiSelectDropdown.handleOptionSelect(checkbox);
                    //                 }
                    //             }
                    //         });
                    //         return;
                    //     }

                    //     // Fallback to localStorage
                    //     const savedLocations = localStorage.getItem(`quotation_${quotationId}_selected_locations`);
                    //     if (savedLocations) {
                    //         try {
                    //             const locationIds = JSON.parse(savedLocations);
                    //             locationIds.forEach(id => {
                    //                 if (window.multiSelectDropdown) {
                    //                     const checkbox = document.querySelector(`#locationMultiSelect input[value="${id}"]`);
                    //                     if (checkbox) {
                    //                         checkbox.checked = true;
                    //                         window.multiSelectDropdown.handleOptionSelect(checkbox);
                    //                     }
                    //                 }
                    //             });
                    //         } catch (e) {
                    //             console.error('Error loading saved locations:', e);
                    //         }
                    //     }
                    // }
                    function loadSavedSelections() {
                        const quotationId = window.quotationId;
                        const savedLocations = localStorage.getItem(
                            `quotation${quotationId}_selected_locations`);

                        if (savedLocations && window.multiSelectDropdown) {
                            try {
                                const locationIds = JSON.parse(savedLocations);
                                console.log(
                                    `Loading saved location selections for quotation ${quotationId}:`,
                                    locationIds);
                                window.multiSelectDropdown.setSelectedValues(
                                    locationIds);
                            } catch (e) {
                                console.error(
                                    'Error loading saved location selections:', e);
                            }
                        }
                    }

                    // Removed duplicate initLocationSelection function - using the one above with button event listeners

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
                    const selectedLocationIds = window.multiSelectDropdown ? window
                        .multiSelectDropdown.getSelectedValues() : [];
                    return selectedLocationIds.map(id => {
                        const location = locations.find(loc => loc.id == id);
                        return location || {
                            id: id
                        };
                    });
                };

                // Compatibility function for step2.js validation
                window.validateStep2Form = function() {
                    const selectedLocationIds = window.multiSelectDropdown ? window
                        .multiSelectDropdown.getSelectedValues() : [];
                    if (selectedLocationIds.length === 0) {
                        alert('Please select at least one location.');
                        return false;
                    }
                    return true;
                };

                // // Test function to manually test pills
                // window.testPills = function() {
                //     console.log('Testing pills functionality');
                //     const pillsContainer = document.querySelector('.selected-pills');
                //     if (pillsContainer) {
                //         // Remove placeholder
                //         const placeholder = pillsContainer.querySelector('.text-gray-400');
                //         if (placeholder) placeholder.remove();

                //         // Create a manual test pill
                //         const testPill = document.createElement('div');
                //         testPill.className = 'location-pill';
                //         testPill.style.cssText = `
    //             display: inline-flex;
    //             align-items: center;
    //             background-color: #2563eb;
    //             color: white;
    //             padding: 0.375rem 0.75rem;
    //             border-radius: 9999px;
    //             font-size: 0.875rem;
    //             font-weight: 500;
    //             margin: 0.125rem;
    //             box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    //         `;
                //         testPill.innerHTML = `
    //             <span style="margin-right: 0.5rem;">Test Location</span>
    //             <div style="
    //                 padding: 0.125rem;
    //                 border-radius: 50%;
    //                 background-color: rgba(255, 255, 255, 0.2);
    //                 cursor: pointer;
    //                 display: flex;
    //                 align-items: center;
    //                 justify-content: center;
    //                 width: 16px;
    //                 height: 16px;
    //             " onclick="this.parentElement.remove()">
    //                 <svg style="width: 10px; height: 10px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
    //                 </svg>
    //             </div>
    //         `;

                //         pillsContainer.appendChild(testPill);
                //         console.log('Manual test pill added');
                //     }

                //     if (window.multiSelectDropdown) {
                //         console.log('Adding test pill via multiSelectDropdown');
                //         window.multiSelectDropdown.addPill('test-1', 'Test Location 1');
                //         console.log('Test pill added');
                //     } else {
                //         console.error('multiSelectDropdown not available');
                //     }
                // };
            </script>
            @vite('resources/js/Step2/step2.js')
        @endsection

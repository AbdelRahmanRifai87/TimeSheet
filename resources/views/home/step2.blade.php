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

        .open-section {
            max-height: 500px !important;
            /* adjust as needed */
            opacity: 1 !important;
        }

        #previewModal .bg-white {
            resize: both;
            overflow: auto;
            min-width: 300px;
            min-height: 200px;
            max-width: 98vw;
            max-height: 98vh;
            transition: width 0.2s, height 0.2s;
            box-sizing: border-box;
        }

        /* Rounded scrollbar for preview modal */
        #previewModalContent {
            scrollbar-width: thin;
            scrollbar-color: #2679b5 #f3f4f6;
            /* thumb color, track color */
        }

        /* For Webkit browsers (Chrome, Edge, Safari) */
        #previewModalContent::-webkit-scrollbar {
            width: 10px;
            border-radius: 8px;
            background: #f3f4f6;
        }

        #previewModalContent::-webkit-scrollbar-thumb {
            background: #2679b5;
            border-radius: 8px;
        }

        #previewModalContent::-webkit-scrollbar-corner {
            background: #f3f4f6;
            border-radius: 8px;
        }

        #previewModalContent,
        #previewModalContent>.flex-grow {
            height: 100%;
        }

        #previewModalContent .dataTables_scrollBody {
            height: 100% !important;
            max-height: 100% !important;
        }
    </style>
@endsection

@section('content')
    <div class="flex justify-end mt-2 mb-1 p-1">
        <a href="{{ route('quotation.index') }}"
        class="bg-gray-500 hover:bg-gray-60 text-white p-1 rounded ">
        Back to Quotations
        </a>
    </div>
    <div class="w-[100%]  overflow-y-auto bg-white-100">

<!-- Quotation Summary Block -->
<div class="mt-3 mb-4 p-1 bg-green-50 border border-green-200 rounded" id="quotation-summary">
<!-- Quotation Header -->
<div class="bg-green-50 p-4 mb-4 rounded" id="quotationHeader">
    <div class="flex items-start justify-between">
        <div class="flex-grow">
            <div class="editable-field" data-field="name">
                <h1 class="text-xl font-bold text-[#2679b5] display-value">{{ $quotation->name }}</h1>
                <div class="edit-input hidden">
                    <label class="block text-sm font-semibold text-[#2679b5] mb-1">
                        <i class="fas fa-file-alt mr-1"></i>Quotation Name
                    </label>
                    <input type="text" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200" value="{{ $quotation->name }}" placeholder="Enter quotation name">
                </div>
            </div>
            <div class="editable-field mt-3" data-field="client_name">
                <p class="text-gray-600 display-value">Client Name: {{ $quotation->client_name }}</p>
                <div class="edit-input hidden">
                    <label class="block text-sm font-semibold text-[#2679b5] mb-1">
                        <i class="fas fa-user mr-1"></i>Client Name
                    </label>
                    <input type="text" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200" value="{{ $quotation->client_name }}" placeholder="Enter client name">
                </div>
            </div>
            <div class="editable-field mt-3" data-field="status">
                <p class="text-gray-700 display-value">
                    <span class="font-semibold">Status:</span>
                    <span id="quotation-status" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {{ $quotation->status === 'sent to client' ? 'bg-yellow-100 text-yellow-800' : ($quotation->status === 'finalized' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800') }}">
                        {{ ucfirst($quotation->status) ?? '-' }}
                    </span>
                </p>
                <div class="edit-input hidden">
                    <label class="block text-sm font-semibold text-[#2679b5] mb-1">
                        <i class="fas fa-info-circle mr-1"></i>Status
                    </label>
                    <select class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200">
                        <option value="in_progress" {{ $quotation->status === 'in_progress' ? 'selected' : '' }}>In Progress</option>
                        <option value="finalized" {{ $quotation->status === 'finalized' ? 'selected' : '' }}>Finalized</option>
                        <option value="sent to client" {{ $quotation->status === 'sent to client' ? 'selected' : '' }}>Sent to Client</option>
                    </select>
                </div>
            </div>
            <div class="editable-field mt-3" data-field="description">
                <p class="text-gray-700 display-value">
                    <span class="font-semibold">Description:</span>
                    <span class="text-gray-600">{{ $quotation->description ?? 'No description' }}</span>
                </p>
                <div class="edit-input hidden">
                    <label class="block text-sm font-semibold text-[#2679b5] mb-1">
                        <i class="fas fa-align-left mr-1"></i>Description
                    </label>
                    <textarea class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 resize-vertical" rows="3" placeholder="Enter quotation description">{{ $quotation->description }}</textarea>
                </div>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <!-- Edit/Save/Cancel Buttons -->
            <button type="button" id="editQuotationBtn" class="text-blue-600 hover:text-blue-800" title="Edit Quotation">
                <i class="fas fa-edit"></i>
            </button>
            <button type="button" id="saveQuotationBtn" class="hidden text-green-600 hover:text-green-800" title="Save Changes">
                <i class="fas fa-check"></i>
            </button>
            <button type="button" id="cancelQuotationBtn" class="hidden text-gray-600 hover:text-gray-800" title="Cancel Edit">
                <i class="fas fa-times"></i>
            </button>
            
            <!-- Toggle Summary Button -->
            <button type="button" id="toggleQuotationSummaryBtn"
                    class="text-[#2679b5] hover:underline flex items-center gap-1">
                <i id="quotation-summary-chevron" class="fas fa-chevron-down transition-transform duration-200"></i>
            </button>
        </div>
    </div>
    
        <!-- Collapsible summary details (collapsed by default) -->
        <div id="quotation-summary-details" class="mt-3 grid gap-2 sm:grid-cols-2 hidden">
            <div class="flex items-center gap-2">
                <span class="text-blue-600"><i class="fas fa-map-marker-alt"></i></span>
                <span class="font-semibold">Locations:</span>
                <span id="summary-locations">
                    @php
                        $names = [];
                        if (isset($selectedLocations) && !empty($selectedLocations)) {
                            $locMap = collect($locations ?? [])->pluck('name', 'id');
                            foreach ((array) $selectedLocations as $item) {
                                if (is_object($item) && isset($item->name)) {
                                    $names[] = $item->name;
                                } elseif (is_array($item) && isset($item['name'])) {
                                    $names[] = $item['name'];
                                } elseif (is_scalar($item)) {
                                    $id = (string) $item;
                                    $names[] = $locMap[$id] ?? $locMap[(int) $id] ?? (string) $item;
                                }
                            }
                        }
                    @endphp
                    {{ !empty($names) ? implode(', ', $names) : 'None selected' }}
                </span>
            </div>

            <div class="flex items-center gap-2">
                <span class="text-green-600"><i class="fas fa-calendar-alt"></i></span>
                <span class="font-semibold">Date Range:</span>
                <span id="summary-date-range">{{ $dateRange ?? 'N/A' }}</span>
            </div>

            <div class="flex items-center gap-2">
                <span class="text-yellow-600"><i class="fas fa-list-ol"></i></span>
                <span class="font-semibold">Total Shifts:</span>
                <span id="summary-total-shifts">{{ $totalShifts ?? 0 }}</span>
            </div>

            <div class="flex items-center gap-2">
                <span class="text-purple-600"><i class="fas fa-coins"></i></span>
                <span class="font-semibold">Total Billable:</span>
                <span id="summary-total-billable">
                    {{ number_format($totalBillable ?? 0, 2) }} {{ $quotation->currency ?? 'USD' }}
                </span>
            </div>

            <div class="flex items-center gap-2">
                <span class="text-pink-600"><i class="fas fa-calendar-day"></i></span>
                <span class="font-semibold">Unique Days:</span>
                <span id="summary-unique-days">{{ $uniqueDays ?? 0 }}</span>
            </div>

            {{-- <div class="w-full mt-2 text-gray-700 sm:col-span-2">
                <span class="font-semibold">Description:</span>
                <span id="summary-description">{{ $quotation->description ?? '-' }}</span>
            </div> --}}
        </div>
    </div>
</div>
            <!-- End Quotation Summary Block -->
        </div>

        <!-- Shift Types Dropdown Setup -->
        <div class="mb-6 bg-yellow-100 rounded shadow border border-gray-200">
            <div id="shiftTypeDropdownToggle" class="flex items-center justify-between cursor-pointer  px-4 py-3 pb-0 ">
                <span class="text-lg font-semibold text-[#2679b5] mb-2">Shift Type Setup</span>
                <span id="shiftTypeDropdownArrow" class="transition-transform duration-200">
                    <i class="fas fa-chevron-down"></i>
                </span>
            </div>
            <div id="shiftTypeDropdownContent" class="transition-all  duration-700  overflow-hidden max-h-0 mt-1">
                <div class=" shadow-lg w-[100%]  p-6 pt-0 relative " style="max-height:80vh;overflow-y:auto">


                    <div class="flex justify-end mb-1">
                        <button id="addShiftTypeBtn" class="bg-blue-600 text-white px-2 py-1 rounded">Add Shift
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
                            <tr id="shiftTypeCrudTableLoadingRow">
                                <td colspan="8" class="text-center py-6">
                                    <div class="flex flex-col items-center justify-center">
                                        <svg class="animate-spin h-8 w-8 text-blue-600 mb-2"
                                            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10"
                                                stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                        </svg>
                                        <span class="text-blue-600 font-semibold">Loading...</span>
                                    </div>
                                </td>
                            </tr>
                            <!-- Rows will be rendered by JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Location Dropdown Setup -->
        <div class="mb-6 bg-blue-100 rounded shadow border border-gray-200">
            <div id="locationDropdownToggle" class="flex items-center justify-between cursor-pointer  px-4 py-3 pb-0 ">
                <span class="text-lg font-semibold text-[#2679b5] mb-2">Location Setup</span>
                <span id="locationDropdownArrow" class="transition-transform duration-200">
                    <i class="fas fa-chevron-down"></i>
                </span>
            </div>
            <div id="locationDropdownContent" class="transition-all duration-700 overflow-hidden max-h-0 mt-1">
                <div class=" w-[100%] p-6 pt-0 relative" style="max-height:80vh;overflow-y:auto;">

                    <div class="flex justify-end mb-2">
                        <button id="addLocationBtn" class="bg-blue-600 text-white px-2 py-1 rounded">Add Location</button>
                    </div>
                    <table id="locationCrudTable" class="min-w-full border">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="border px-2 py-1 text-center" style="width: 50px;">Select</th>

                            <th class="border px-2 py-1">Name</th>
                            <th class="border px-2 py-1">Address</th>
                            <th class="border px-2 py-1">City</th>
                            <th class="border px-2 py-1">State</th>
                            <th class="border px-2 py-1">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
 
                    </tbody>
                    </table>
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

                                </div>
                                <!-- New Shift Details Section -->
                                <div class="mt-1   rounded mx-5  " id="batchForm_{{ $location->id }}">
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
                                    <div class="flex justify-end gap-2">
                                        <button type="button" id="reviewTableBtn_{{ $location->id }}"
                                            class="bg-[#428bca] hover:bg-blue-600 text-white px-3 py-2 rounded border mt-3 ">
                                            Review Table
                                            <span class="review-btn-spinner hidden ">
                                                <i class="fas fa-spinner fa-spin"></i>
                                            </span>
                                        </button>
                                        <button type="button" id="saveBtn_{{ $location->id }}"
                                            class="bg-[#87b87f] hover:bg-lime-700 text-white px-3 py-2 rounded border mt-3 ">
                                            <span class="save-btn-text">Save</span>
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
                            {{-- <button type="button" id="processExportBtn"
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                                <i class="fas fa-download mr-1"></i>
                                Export
                            </button> --}}
                            <button type="button" id="reviewExportBtn"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                                <i class="fas fa-eye mr-1"></i>
                                Review
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
                <div id="previewModalContent"
                    class="bg-white rounded-lg shadow-lg p-6 relative overflow-y-auto flex flex-col"
                    style="
                            min-width:300px;
                            min-height:200px;
                            width:80vw;           /* Initial width: 80% of viewport */
                            height:70vh;          /* Initial height: 70% of viewport */
                            max-width:98vw;       /* Never exceed 98% of viewport width */
                            max-height:98vh;      /* Never exceed 98% of viewport height */
                            resize:both;
                            box-sizing:border-box;
                        ">
                    <button type="button" id="closePreviewModal"
                        class="absolute top-1 right-2 text-gray-500 hover:text-red-600 text-2xl">&times;</button>
                    <h2 class="text-2xl  text-[#2679b5] mb-4">Timesheet Preview</h2>

                    <div class="mb-3 border rounded bg-gray-50 location-visibility-dropdown">
                        <div id="locationVisibilityToggle"
                            class="flex m-2 items-center cursor-pointer justify-between select-none">
                            <h3 class="text-lg text-[#2679b5] mb-1 mr-2">Location Visibility</h3>
                            <span id="locationVisibilityArrow" class="transition-transform duration-200">
                                <i class="fas fa-chevron-down"></i>
                            </span>
                        </div>
                        <div id="locationVisibilityContent"
                            class="w-full m-2 transition-all duration-500 ease-in-out max-h-0 overflow-hidden opacity-0">
                            <div id="locationDropdownText" class="flex flex-wrap gap-2"></div>
                        </div>
                    </div>

                    <!-- Column Visibility Custom Dropdown -->
                    <div class="mb-3 border  rounded bg-gray-50 column-visibility-dropdown">
                        <div id="columnVisibilityToggle"
                            class="flex m-2 items-center cursor-pointer justify-between  select-none">
                            <h3 class="text-lg  text-[#2679b5] mb-1 mr-2">Column Visibility</h3>
                            <span id="columnVisibilityArrow" class="transition-transform duration-200"><i
                                    class="fas fa-chevron-down"></i></span>
                            <!-- ▼ arrow, rotate when open -->
                        </div>
                        <div id="columnVisibilityContent"
                            class="w-full mt-2 transition-all duration-500 ease-in-out max-h-0 overflow-hidden opacity-0">
                            <div id="columnDropdownText" class="flex flex-wrap gap-2"></div>
                            <p class="mt-1 ml-1 text-sm text-gray-500">Core columns are required and cannot be deselected.
                            </p>
                        </div>
                    </div>
                    <!-- Preview Table -->



                    <div id="previewTableWrapper" class="overflow-x-auto flex-grow min-h-0 ">
                        <table id="previewTable" class="display w-full">
                            <thead id="previewTableHead1"></thead>
                            <tbody id="previewTableBody1"></tbody>
                        </table>
                    </div>

                    <!-- Add this where you want the radio options to appear -->
                    <div id="previewLocationOptionPlaceholder"></div>

                    <div id="exportBTN"></div>

                </div>
            </div>
            <!-- Global Loading Overlay -->
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

            </div>



<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<script>
        // Set quotation ID globally
        window.quotationId = @json($quotation->id);
        window.locations = @json($locations);
        window.quotationCurrency = @json($quotation->currency ?? 'USD');


        function showLocationTableLoading() {
        const tbody = document.querySelector("#locationCrudTable tbody");
        if (!tbody) return;
        tbody.innerHTML = `
            <tr id="locationCrudTableLoadingRow">
            <td colspan="5" class="text-center py-6">
            <div class="flex flex-col items-center justify-center">
            <svg class="animate-spin h-8 w-8 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span class="text-blue-600 font-semibold">Loading...</span>
            </div>
            </td>
            </tr>
            `;
    }

        function hideLocationTableLoading() {
            const loadingRow = document.getElementById('locationCrudTableLoadingRow');
            if (loadingRow) loadingRow.remove();
        }

        // Show the loading row in the shift types table
        window.showShiftTypeTableLoading = function showShiftTypeTableLoading() {
            const row = document.getElementById('shiftTypeCrudTableLoadingRow');
            if (row) row.style.display = '';
        }

        // Hide the loading row in the shift types table
        window.hideShiftTypeTableLoading = function hideShiftTypeTableLoading() {
            const row = document.getElementById('shiftTypeCrudTableLoadingRow');
            if (row) row.style.display = 'none';
        }

        async function calculateForMultipleLocations(locationsData) {
            // locationsData: Array of { location_id, shifts: [...] }
            try {

                const response = await apiService.calculateReviewMulti({
                    locations: locationsData,
                });
                if (response.data.success) {
                    console.log("success");
                    console.log("Calculation result:", response);
                    // response.data.results is expected to be an object keyed by location_id
                    // Each value contains timesheet_data, timesheet_headings, totals, etc.
                    return response.data;
                } else {
                    console.log("Failed to calculate for multiple locations.", );
                    return null;
                }
            } catch (error) {
                console.log("Error calculating for multiple locations.", );
                console.error(error);
                return null;
            }
        }

        // Simplified Location Selection and Display Logic
        document.addEventListener('DOMContentLoaded', async function() {
            const locations = @json($locations);
            const quotationId = @json($quotation->id);
            const savedLocationSchedules = @json($savedLocationSchedules ?? []);



            function toggleSection(toggleId, contentId, arrowId) {
                const toggle = document.getElementById(toggleId);
                const content = document.getElementById(contentId);
                const arrow = document.querySelector(`#${arrowId} i`);

                if (toggle && content && arrow) {
                    toggle.addEventListener('click', function() {
                        // Animation logic similar to toggleForm
                        if (content.classList.contains('max-h-0') || !content.classList.contains(
                                'open-section')) {
                            content.classList.remove('max-h-0');
                            content.classList.add('open-section');
                            content.style.opacity = 1;
                            arrow.classList.remove('fa-chevron-down');
                            arrow.classList.add('fa-chevron-up');
                        } else {
                            content.classList.add('max-h-0');
                            content.classList.remove('open-section');
                            content.style.opacity = 0;
                            arrow.classList.add('fa-chevron-down');
                            arrow.classList.remove('fa-chevron-up');
                        }
                    });
                }
            }
            toggleSection('locationVisibilityToggle', 'locationVisibilityContent', 'locationVisibilityArrow');
            toggleSection('columnVisibilityToggle', 'columnVisibilityContent', 'columnVisibilityArrow');

            const toggleshft = document.getElementById('shiftTypeDropdownToggle');
            const contentshft = document.getElementById('shiftTypeDropdownContent');
            const arrowshft = document.querySelector('#shiftTypeDropdownArrow i');

            if (toggleshft && contentshft && arrowshft) {
                toggleshft.addEventListener('click', function() {
                    if (contentshft.classList.contains('max-h-0')) {
                        contentshft.classList.remove('max-h-0');
                        contentshft.classList.add('max-h-[2000px]');
                        arrowshft.classList.remove('fa-chevron-down');
                        arrowshft.classList.add('fa-chevron-up');
                    } else {
                        contentshft.classList.add('max-h-0');
                        contentshft.classList.remove('max-h-[2000px]');
                        arrowshft.classList.add('fa-chevron-down');
                        arrowshft.classList.remove('fa-chevron-up');
                    }
                });
            }

            const toggleloc = document.getElementById('locationDropdownToggle');
            const contentloc = document.getElementById('locationDropdownContent');
            const arrowloc = document.querySelector('#locationDropdownArrow i');

            if (toggleloc && contentloc && arrowloc) {
                toggleloc.addEventListener('click', function() {
                    if (contentloc.classList.contains('max-h-0')) {
                        contentloc.classList.remove('max-h-0');
                        contentloc.classList.add('max-h-[2000px]');
                        arrowloc.classList.remove('fa-chevron-down');
                        arrowloc.classList.add('fa-chevron-up');
                    } else {
                        contentloc.classList.add('max-h-0');
                        contentloc.classList.remove('max-h-[2000px]');
                        arrowloc.classList.add('fa-chevron-down');
                        arrowloc.classList.remove('fa-chevron-up');
                    }
                });
            }
            loadSavedShiftData();
            initializeExportModal();

            // Initialize export modal functionality
            function initializeExportModal() {
                const exportBtn = document.getElementById('exportBtn');
                const exportModal = document.getElementById('exportModal');
                const closeExportModal = document.getElementById('closeExportModal');
                const cancelExportBtn = document.getElementById('cancelExportBtn');
                const processExportBtn = document.getElementById('processExportBtn');

                // Export type radio buttons
                const exportTypeRadios = document.querySelectorAll('input[name="exportType"]');
                const allLocationsOptions = document.getElementById('allLocationsOptions');
                const specificLocationsOptions = document.getElementById('specificLocationsOptions');

                console.log('Initializing export modal...', {
                    exportBtn: !!exportBtn,
                    exportModal: !!exportModal,
                    closeExportModal: !!closeExportModal,
                    cancelExportBtn: !!cancelExportBtn,
                    processExportBtn: !!processExportBtn
                });



                // Open export modal
                if (exportBtn) {
                    exportBtn.addEventListener('click', function() {
                        console.log('Export button clicked - opening modal');
                        updateAvailableLocations();
                        exportModal.classList.remove('hidden');
                        document.body.style.overflow = 'hidden'; // Prevent background scrolling
                    });
                }

                // Close export modal function
                function closeModal() {
                    console.log('Closing export modal');
                    exportModal.classList.add('hidden');
                    document.body.style.overflow = 'auto'; // Restore scrolling
                }

                // Close modal event listeners
                if (closeExportModal) {
                    closeExportModal.addEventListener('click', closeModal);
                }
                if (cancelExportBtn) {
                    cancelExportBtn.addEventListener('click', closeModal);
                }

                // Close modal on backdrop click
                if (exportModal) {
                    exportModal.addEventListener('click', function(e) {
                        if (e.target === exportModal) {
                            closeModal();
                        }
                    });
                }

                // Close modal on ESC key
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && !exportModal.classList.contains('hidden')) {
                        closeModal();
                    }
                });

                // Handle export type change
                exportTypeRadios.forEach(radio => {
                    radio.addEventListener('change', function() {
                        console.log('Export type changed to:', this.value);
                        if (this.value === 'all') {
                            allLocationsOptions.classList.remove('hidden');
                            specificLocationsOptions.classList.add('hidden');
                        } else {
                            allLocationsOptions.classList.add('hidden');
                            specificLocationsOptions.classList.remove('hidden');
                        }
                    });
                });
                if (reviewExportBtn) {
                    reviewExportBtn.addEventListener('click', async function() {


                        // Gather selected locations as in export logic
                        // ... (same as export logic up to calculation)
                        // 1. Determine export type and selected locations
                        const exportType = document.querySelector(
                                'input[name="exportType"]:checked')
                            .value;
                        let selectedLocations = [];

                        if (exportType === "specific") {
                            // Get checked checkboxes in the specific locations section
                            const checkedBoxes = document.querySelectorAll(
                                '#availableLocationsContainer input[name="specificLocations"]:checked'
                            );
                            const allWithData = getLocationsWithShiftData();
                            selectedLocations = Array.from(checkedBoxes).map(cb => {
                                return allWithData.find(loc => String(loc.id) === String(cb
                                    .value));
                            }).filter(Boolean);
                        } else {
                            // All locations with data
                            selectedLocations = getLocationsWithShiftData();
                        }

                        if (selectedLocations.length === 0) {
                            showToast("Please select at least one location with shift data.",
                                "error");
                            return;
                        }

                        const locationsData = selectedLocations.map(loc => ({
                            location_id: loc.id,
                            shifts: loc.shiftData.map(shift => {
                                // Find the shift type by name
                                const shiftTypeObj = shiftTypes.find(st => st
                                    .name === shift.shiftType || st.id ===
                                    shift.shiftTypeId || st.id === shift
                                    .shift_type_id);
                                return {
                                    shift_type_id: shiftTypeObj ? shiftTypeObj
                                        .id : null, // must be integer
                                    from: shift.from,
                                    to: shift.to,
                                    employees: parseInt(shift.employees, 10),
                                    day: shift.day,
                                    date_range: shift.dateRange || shift
                                        .date_range,
                                };
                            })
                        }));


                        showLoading();
                        const calcResult = await calculateForMultipleLocations(locationsData);
                        hideLoading();

                        if (!calcResult || !calcResult.success) {
                            showToast("Failed to prepare preview data.", "error");
                            return;
                        }
                        console.log("calc relsult:", calcResult);
                        latestMultiCalculateResponses = calcResult;



                        // Populate the preview table
                        // If multiple locations, you may want to show tabs or a summary
                        // If one location, just show the table as usual
                        // Example for one location:
                        // By default, select all columns
                        // Store data locally
                        const previewHeadings = calcResult.timesheet_headings;
                        const previewData = calcResult.timesheet_data;
                        // const coreColumns = [
                        //     "week_starting",
                        //     "shift_type",
                        //     "location",
                        // ]; // match backend keys

                        // By default, select all columns
                        const selectedColumnIds = new Set(
                            previewHeadings.map((h) =>
                                h.toLowerCase().replace(/[^a-z0-9]/g, "_")
                            )
                        );
                        window.originalPreviewHeadings =
                            previewHeadings; // Do this in your code where you first get the headings

                        const exportId = generateRecordId();
                        // Pass all locations, not just selected ones
                        const allLocationIds = window.multiSelectDropdown ?
                            window.multiSelectDropdown.getSelectedValues() : [];
                        // Get only the locations checked in the export modal
                        let checkedExportLocationIds = [];
                        if (exportType === "specific") {
                            const checkedBoxes = document.querySelectorAll(
                                '#availableLocationsContainer input[name="specificLocations"]:checked'
                            );
                            checkedExportLocationIds = Array.from(checkedBoxes).map(cb => String(cb
                                .value));
                        } else {
                            checkedExportLocationIds = selectedLocations.map(loc => String(loc.id));
                        }
                        const selectedLocationIds = new Set(checkedExportLocationIds);
                        console.log(selectedLocationIds);
                        console.log(allLocationIds);



                        const allLocationData = {};
                        if (calcResult && calcResult.results) {
                            Object.entries(calcResult.results).forEach(([locationId, data]) => {
                                console.log(data);
                                console.log(locationId);
                                allLocationData[locationId] = data;
                            });
                        }
                        window.allLocationData = allLocationData;
                        console.log(window.allLocationData);

                        showPreviewTableModal({
                            headings: previewHeadings,
                            data: previewData,
                            selectedColumnIds,
                            totals: calcResult.totals,
                            exportId,
                            allSelectedLocationIds: allLocationIds,
                            selectedLocationIds,
                            allLocationData
                        });
                    });
                }
            }

            window.updateAvailableLocations = function updateAvailableLocations() {
                const container = document.getElementById('availableLocationsContainer');
                if (!container) {
                    console.log('Available locations container not found');
                    return;
                }

                container.innerHTML = '';

                // Get locations that have saved shift data
                const locationsWithData = getLocationsWithShiftData();
                console.log('Locations with data:', locationsWithData);

                if (locationsWithData.length === 0) {
                    container.innerHTML =
                        '<p class="text-sm text-gray-500">No locations with saved shift data found.</p>';
                    return;
                }

                locationsWithData.forEach(location => {
                    const div = document.createElement('div');
                    div.className = 'flex items-center justify-between p-2 border rounded';

                    // Use the record count from the enhanced getLocationsWithShiftData function
                    const recordCount = location.recordCount || 0;

                    div.innerHTML = `
            <label class="flex items-center flex-1">
                <input type="checkbox" name="specificLocations" value="${location.id}" class="mr-2">
                <div>
                    <span class="font-medium">${location.name}</span>
                    <div class="text-xs text-gray-500">${location.address}</div>
                </div>
            </label>
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                ${recordCount} shift${recordCount !== 1 ? 's' : ''}
            </span>
        `;

                    container.appendChild(div);
                });
            }

            window.getLocationsWithShiftData = function getLocationsWithShiftData() {
                const locationsWithData = [];
                console.log("locations........", locations);


                window.locations.forEach(location => {
                    let recordCount = 0;
                    let hasData = false;
                    let dataSource = '';


                    // ONLY check localStorage - ignore window.records completely
                    const quotationId = window.quotationId;
                    const possibleKeys = [
                        `quotation_${quotationId}selectedlocations${location.id}Records`,
                        // `records_${location.id}`,
                        // `quotation${quotationId}selectedlocation${location.id}Records`,
                        // `quotation_${quotationId}selectedlocations${location.id}Records`, // Primary pattern
                        // `quotation_${quotationId}_selectedlocations${location.id}Records`,
                        // `quotation${quotationId}_selectedlocations${location.id}Records`
                    ];
                    // Log all localStorage data
                    console.log('--- All localStorage data ---');
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        const value = localStorage.getItem(key);
                        console.log(`${key}:`, value);
                    }
                    console.log('--- End of localStorage data ---');

                    // Check only localStorage keys
                    for (const key of possibleKeys) {
                        const savedRecords = localStorage.getItem(key);
                        console.log(`Checking localStorage key: ${key}`, savedRecords);
                        if (savedRecords) {
                            try {
                                const parsedRecords = JSON.parse(savedRecords);
                                console.log(`Checking localStorage key: ${key}`, {
                                    isArray: Array.isArray(parsedRecords),
                                    length: Array.isArray(parsedRecords) ? parsedRecords
                                        .length : 'N/A',
                                    data: parsedRecords
                                });

                                // Only include if localStorage has valid, non-empty array
                                if (Array.isArray(parsedRecords) && parsedRecords.length > 0) {
                                    recordCount = parsedRecords.length;
                                    hasData = true;
                                    dataSource = `localStorage[${key}]`;
                                    shiftData = parsedRecords;
                                    console.log(
                                        `   Found ${recordCount} valid records for location ${location.name} in ${key} with these records ${shiftData}`
                                    );
                                    break; // Found valid data, stop checking other keys
                                } else if (Array.isArray(parsedRecords) && parsedRecords.length ===
                                    0) {
                                    console.log(
                                        `  Found empty array for location ${location.name} in ${key} - excluding from export`
                                    );
                                    dataSource = `localStorage[${key}] (empty)`;
                                    // Continue checking other keys in case there's valid data elsewhere
                                } else {
                                    console.log(
                                        `  Invalid data format for location ${location.name} in ${key}`
                                    );
                                }
                            } catch (e) {
                                console.error(`Error parsing localStorage key ${key}:`, e);
                            }
                        }
                    }

                    // Add location only if localStorage has valid data
                    if (hasData) {
                        console.log(
                            `   Including location ${location.name} in export (${recordCount} shifts from ${dataSource})`
                        );
                        locationsWithData.push({
                            ...location,
                            recordCount: recordCount,
                            shiftData: shiftData
                        });
                    } else {
                        console.log(
                            `  Excluding location ${location.name} from export (no valid localStorage data found)`
                        );
                    }
                });

                console.log('Final locations with localStorage data:', locationsWithData.map(loc => ({
                    name: loc.name,
                    recordCount: loc.recordCount
                })));




                return locationsWithData;
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

            // Update location display based on multiSelect selections
            function updateLocationDisplay() {
                const quotationId = window.quotationId;
                
                // Get selected locations from localStorage (set by location table checkboxes)
                let selectedLocationIds = [];
                try {
                    const saved = localStorage.getItem(`quotation${quotationId}_selected_locations`);
                    if (saved) selectedLocationIds = JSON.parse(saved);
                } catch {}

                console.log('Updating location display with selected IDs:', selectedLocationIds);

                // Update status message
                const statusMessage = document.getElementById('locationStatusMessage');
                if (statusMessage) {
                    if (selectedLocationIds.length === 0) {
                        statusMessage.textContent = 'Select locations from Location Setup table to configure shifts';
                    } else {
                        statusMessage.textContent = `${selectedLocationIds.length} location(s) selected - Configure shifts below`;
                    }
                }

                // Show/hide location forms based on selection
                const locationForms = document.querySelectorAll('.location-form');
                locationForms.forEach(form => {
                    const locationId = form.getAttribute('data-location-id');
                    // Convert both to strings for comparison
                    if (selectedLocationIds.includes(String(locationId))) {
                        form.style.display = 'block';
                        
                        // Load records for this location when form is shown
                        if (typeof window.loadRecordsForLocation === 'function') {
                            window.loadRecordsForLocation(locationId);
                        }
                        
                        // Also load saved data for this location if it exists in savedLocationSchedules
                        if (window.records && (!window.records[locationId] || window.records[locationId].length === 0)) {
                            const schedule = savedLocationSchedules.find(s => String(s.location_id) === String(locationId));
                            if (schedule && schedule.shift_details) {
                                window.records[locationId] = schedule.shift_details;
                                
                                if (typeof window.renderTable === 'function') {
                                    window.renderTable(locationId);
                                }
                            }
                        }
                    } else {
                        form.style.display = 'none';
                    }
                });

                // Update hidden input
                const selectedLocationsInput = document.getElementById('selectedLocationsInput');
                if (selectedLocationsInput) {
                    selectedLocationsInput.value = JSON.stringify(selectedLocationIds.map(id => String(id)));
                }
                
                // Also update the quotation header summary
                if (typeof window.updateQuotationHeaderSummary === 'function') {
                    window.updateQuotationHeaderSummary();
                }
            }
            // Make functions globally available
            window.updateLocationDisplay = updateLocationDisplay;
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
                        // Update header summary after loading selections
                        if (typeof window.updateQuotationHeaderSummary === 'function') {
                            window.updateQuotationHeaderSummary();
                        }
                    } catch (e) {
                        console.error(
                            'Error loading saved location selections:', e);
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
                const quotationId = window.quotationId;
                let selectedLocationIds = [];
                try {
                    const saved = localStorage.getItem(`quotation${quotationId}_selected_locations`);
                    if (saved) selectedLocationIds = JSON.parse(saved).map(id => String(id));
                } catch {}
                
                return selectedLocationIds.map(id => {
                    const location = locations.find(loc => String(loc.id) === String(id));
                    return location || { id: id };
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
            console.log("tttttttttttttttttttttttttttttttttt");

            document.addEventListener('DOMContentLoaded', function() {
                if (typeof window.loadShiftTypesTable === 'function') {
                    window.loadShiftTypesTable();
                } else {
                    // Wait until it's available
                    const waitForLoad = setInterval(function() {
                        if (typeof window.loadShiftTypesTable === 'function') {
                            window.loadShiftTypesTable();
                            clearInterval(waitForLoad);
                        }
                    }, 100);
                }

                if (typeof window.loadLocationsTable === 'function') {
                    window.loadLocationsTable();
                } else {
                    // Wait until it's available
                    const waitForLoad = setInterval(function() {
                        if (typeof window.loadLocationsTable === 'function') {
                            window.loadLocationsTable();
                            clearInterval(waitForLoad);
                        }
                    }, 100);
                }

                const previewModalContent = document.getElementById("previewModalContent");
                if (previewModalContent && window.ResizeObserver) {
                    const resizeObserver = new ResizeObserver(() => {
                        if ($.fn.DataTable.isDataTable("#previewTable")) {
                            adjustTableScrollY();
                            $("#previewTable").DataTable().columns.adjust();
                        }
                    });
                    resizeObserver.observe(previewModalContent);
                }
            });

</script>
@vite('resources/js/Step2/step2.js')

@endsection

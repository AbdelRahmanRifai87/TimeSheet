@php $currentStep = 2; @endphp
@extends('layouts.app')

@section('content')
    <div class="max-w-2xl mx-auto p-6">
        <h2 class="text-2xl font-bold mb-6">Step 2: Home</h2>
        <form id="step2Form" class="space-y-6" method="POST" action="{{ route('home.step2.submit') }}">
            @csrf
            <!-- 2.1 Multi-select Shift Types -->
            <div>
                <label for="shiftTypes" class="block text-sm font-medium mb-1">Select Shift Types </label>
                <select id="shiftTypes" name="shift_types[]" multiple
                    class="form-multiselect w-full border border-gray-300 rounded px-3 py-2">
                    <!-- Options will be loaded by JS -->
                </select>
                <div class="text-red-500 text-xs mt-1" id="shiftTypesError"></div>
            </div>
            <!-- 2.3 Location Dropdown -->
            <div>
                <label for="location" class="block text-sm font-medium mb-1">Select Location </label>
                <select id="location" name="location_id" multiple
                    class="form-select w-full border border-gray-300 rounded px-3 py-2">

                    <!-- Options will be loaded by JS -->
                </select>
                <div class="text-red-500 text-xs mt-1" id="locationError"></div>
            </div>
            <!-- 2.3 Date Range -->

            <div>
                <label for="dateRange" class="block text-sm font-medium mb-1">Date Range </label>
                <input type="text" id="dateRange" name="date_range"
                    class="form-input w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Select date range (YYYY-MM-DD to YYYY-MM-DD)">
                <div class="text-red-500 text-xs mt-1" id="dateRangeError"></div>
            </div>

            <div class="flex justify-end mt-4">
                <button id="addSelectionBtn" type="button"
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-400">
                    Add
                </button>
            </div>


            <button type="button" id="backBtn"
                class="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded border ml-2">Back</button>
            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded border">Next</button>

        </form>
        <div class="mt-6">
            <h3 class="text-lg font-semibold mb-2">Selected Options</h3>
            <div id="summarySection" class="bg-gray-100 border border-gray-300 rounded p-4">

            </div>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script>
        window.staticJwt = @json(env('STATIC_JWT'));
        window.selectedShiftTypes = @json(session('step2.shift_types', []));
        window.selectedLocationId = @json(session('step2.location_id', ''));
        window.selectedDateRange = @json(session('step2.date_range', ''));
    </script>
    @vite('resources/js/Step2/step2.js')
@endsection

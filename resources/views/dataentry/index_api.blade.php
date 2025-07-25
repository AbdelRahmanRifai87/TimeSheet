@php $currentStep = 1; @endphp
@extends('layouts.app')

@section('content')
<div class="max-w-5xl p-6 mx-auto px-10">
    <h2 class="text-2xl font-bold mb-6">Step 1: Data Entry</h2>

    {{-- Editable Shift Types & Rates Table --}}
    <h4 class="text-lg font-semibold mb-2">Shift Types & Rates</h4>
    <form id="shiftRatesForm" class="mb-8">
        <div class="overflow-x-auto rounded-lg shadow w-full border">
        <table class="min-w-full bg-white border border-gray-200 w-full" id="shiftRatesTable">
            <thead class="bg-gray-100">
                <tr>
                    <th class="px-2 py-2 border-b border text-left">Shift Type</th>
                    <th class="px-4 py-2 border-b border text-left">Description</th>
                    @foreach($dayTypes as $dayType)
                        <th class="px-4 py-2 border-b border text-left">{{ $dayType->name }} Rate</th>
                    @endforeach
                    <th class="px-4 py-2 border-b border text-left">Actions</th>
                </tr>
            </thead>
            <tbody>
                @foreach($shiftTypes as $shiftType)
                <tr data-id="{{ $shiftType->id }}" class="hover:bg-gray-50 border">
                    <td class="px-4 py-2 border-b border"><input type="text" name="shift_type_name[]" class="form-input w-full border border-gray-300 rounded px-3 py-2" value="{{ $shiftType->name }}" required></td>
                    <td class="px-4 py-2 border-b border"><input type="text" name="shift_type_description[]" class="form-input w-full border border-gray-300 rounded px-3 py-2" value="{{ $shiftType->description }}"></td>
                    @foreach($dayTypes as $dayType)
                        <td class="px-4 py-2 border-b border">
                            <input 
                            type="number" 
                            step="0.01" 
                            name="rate_{{ $shiftType->id }}_{{ $dayType->id }}" 
                            class="form-input w-full border border-red-300 rounded px-3 py-2" 
                            value="{{ optional($shiftType->rates->where('day_type_id', $dayType->id)->first())->rate }}"   
                            @if(optional($shiftType->rates->where('day_type_id', $dayType->id)->first())->id)
                            data-rate-id="{{ $shiftType->rates->where('day_type_id', $dayType->id)->first()->id }}"
                            @endif required
                            >
                        </td>
                    @endforeach
                    <td class="px-4 py-2 border-b border text-center"><button type="button" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs border remove-shift">Remove</button></td>
                </tr>
                @endforeach
            </tbody>
        </table>
        </div>
        <div class="flex gap-2 mt-4">
            <button type="button" class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded border" id="addShiftType">Add Shift Type</button>
<button type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 border" id="saveShiftRates">
    <span>Save Shift Types & Rates</span>
    <svg id="saveLoadingSpinner" class="hidden animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
    </svg>
</button>        </div>
        <div id="shiftRatesStatus" class="mt-2 text-sm"></div>
    </form>

    <hr class="my-8">


    {{-- Locations Table --}}
    <h4 class="text-lg font-semibold mb-2">Locations</h4>
    <div class="overflow-x-auto rounded-lg shadow mb-8 border">
    <table class="min-w-full bg-white border border-gray-200" id="locationsTable">
        <thead class="bg-gray-100">
            <tr>
                <th class="px-4 py-2 border-b border text-left">Name</th>
                <th class="px-4 py-2 border-b border text-left">Address</th>
                <th class="px-4 py-2 border-b border text-left">City</th>
                <th class="px-4 py-2 border-b border text-left">State</th>
                <th class="px-4 py-2 border-b border text-left">Province</th>
                <th class="px-4 py-2 border-b border text-left">Actions</th>
            </tr>
        </thead>
        <tbody>
            @foreach($locations as $location)
            <tr data-id="{{ $location->id }}" class="hover:bg-gray-50 border">
                <td class="px-4 py-2 border-b border">{{ $location->name }}</td>
                <td class="px-4 py-2 border-b border">{{ $location->address }}</td>
                <td class="px-4 py-2 border-b border">{{ $location->city }}</td>
                <td class="px-4 py-2 border-b border">{{ $location->state }}</td>
                <td class="px-4 py-2 border-b border">{{ $location->province }}</td>
                <td class="px-4 py-2 border-b border text-center"><button type="button" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs border remove-location">Remove</button></td>
            </tr>
            @endforeach
        </tbody>
    </table>
    </div>


    {{-- Location Modal (Tailwind) --}}
    
{{-- Flex row for button and any other controls --}}
<div class="flex items-center gap-4 mb-4">
    <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded border" id="showLocationModal">
        Add New Location
    </button>
    {{-- You can add more buttons or controls here if needed --}}
</div>

    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 invisible hidden" id="locationModal">
       <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto ">
         <form id="locationForm">
            @csrf
            <div class="px-6 py-4 border-b  flex justify-between items-center">
                <h5 class="text-lg font-semibold" id="locationModalLabel">Add New Location</h5>
                <button type="button" class="text-gray-400 hover:text-gray-600 text-2xl leading-none font-bold " id="closeLocationModal">&times;</button>
            </div>
            <div class="px-6 py-4">
                <!-- Your form fields here -->
                <div class="mb-4">
            <label for="loc_name" class="block text-sm font-medium mb-1">Name <span class="text-red-500">*</span></label>
            <input type="text" class="form-input w-full border border-gray-700 rounded px-3 py-2" id="loc_name" name="name" >
            <div class="text-red-500 text-xs mt-1" id="loc_name_error"></div>
          </div>
          <div class="mb-4">
            <label for="loc_address" class="block text-sm font-medium mb-1">Address</label>
            <input type="text" class="form-input w-full border border-gray-300 rounded px-3 py-2" id="loc_address" name="address">
            <div class="text-red-500 text-xs mt-1" id="loc_address_error"></div>
          </div>
          <div class="mb-4">
            <label for="loc_city" class="block text-sm font-medium mb-1">City</label>
            <input type="text" class="form-input w-full border border-gray-300 rounded px-3 py-2" id="loc_city" name="city">
            <div class="text-red-500 text-xs mt-1" id="loc_city_error"></div>
          </div>
          <div class="mb-4">
            <label for="loc_state" class="block text-sm font-medium mb-1">State</label>
            <input type="text" class="form-input w-full border border-gray-300 rounded px-3 py-2" id="loc_state" name="state">
            <div class="text-red-500 text-xs mt-1" id="loc_state_error"></div>
          </div>
          <div class="mb-4">
            <label for="loc_province" class="block text-sm font-medium mb-1">Province</label>
            <input type="text" class="form-input w-full border border-gray-300 rounded px-3 py-2" id="loc_province" name="province">
            <div class="text-red-500 text-xs mt-1" id="loc_province_error"></div>
          </div>
          <div id="locationStatus" class="mt-2 text-sm"></div>
            </div>
            <div class="px-6 py-4 border-t  flex justify-end">
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded border">Save Location</button>
            </div>
         </form>
          </div>
      </div>


       

 
       {{-- Next Step Button --}}
      <a href="#" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded border" id="nextStepBtn">Next</a>
</div>



<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<script>
    window.dayTypes = @json($dayTypes);
    
   
</script>
@vite('resources/js/dataentry.js')
@endsection


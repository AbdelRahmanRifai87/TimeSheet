@php $currentStep = 3; @endphp
@extends('layouts.app')

@section('content')
    <style>
        .choices__inner {
            max-height: 5rem;
            /* Same as Tailwind's max-h-24 */
            overflow-y: auto;
        }
    </style>
    <div class="max-w-4xl mx-auto p-6">
        <h2 class="text-2xl font-bold  mb-6">Step 3: Shift Details</h2>
        <form id="step3Form" method="POST" action="{{ route('details.step3.submit') }}">
            @csrf
            <div class="mb-4">
                <button type="button" onclick="window.location='{{ route('home.step2.get') }}'"
                    class="bg-gray-400 text-white px-4 py-2 rounded mr-2">Back</button>
                <button type="submit"
                    class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded border">Next</button>
            </div>
            <!-- Batch Update Form -->
            <div class="mb-6 p-4 border rounded bg-gray-50">
                <div class="flex flex-wrap gap-4 items-end">
                    <!-- Shift Type Dropdown -->
                    <div class="flex-1">
                        <label class="block mb-1 font-semibold">Shift Type</label>
                        <select id="batchShiftType" class="border rounded px-2 py-1 ">
                            <option value="">Select</option>
                            @foreach ($shiftTypes as $st)
                                <option value="{{ $st->id }}">{{ $st->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <!-- From Time -->
                    <div>
                        <label class="block mb-1 font-semibold">From</label>
                        <input type="time" id="batchFrom" class="border rounded px-2 py-1" />
                    </div>
                    <!-- To Time -->
                    <div>
                        <label class="block mb-1 font-semibold">To</label>
                        <input type="time" id="batchTo" class="border rounded px-2 py-1" />
                    </div>
                    <!-- Number of Employees -->
                    <div>
                        <label class="block mb-1 font-semibold"># Employees</label>
                        <input type="number" id="batchEmployees" class="border rounded px-2 py-1" min="1"
                            value="1" />
                    </div>
                    <!-- Days Multi-select -->
                    <div class="w-full flex flex-col">
                        <label class="block mb-1 font-semibold">Days</label>
                        <select id="batchDays" class="border rounded px-2 py-1 w-full" multiple size="7"></select>
                        <div class="w-full mt-3 flex gap-2">
                            <button type="button" id="addShiftBtn" class="bg-blue-600 text-white px-4 py-2 rounded ">Add
                                shift</button>
                            <button type="button" id="updateShiftBtn"
                                class="bg-blue-600 text-white px-4 py-2 rounded ">Update
                                shift</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mb-4 flex items-center gap-4">
                <label>Filter by Day:</label>
                <select id="filterDay" class="border rounded px-2 py-1"></select>
                <label class="ml-4">Filter by Shift Type:</label>
                <select id="filterShiftType" class="border rounded px-2 py-1"></select>
                <button id="updateRowBtn" class="bg-blue-500 text-white px-4 py-2 rounded ml-4 hidden">Update</button>

            </div>
            <table class="min-w-full border mt-4" id="shiftTable">
                <thead>
                    <tr>
                        <th class="border px-2 py-1 w-29">Day</th>
                        <th class="border px-2 py-1">Shift Type</th>
                        <th class="border px-2 py-1 w-20">From</th>
                        <th class="border px-2 py-1 w-20">To</th>
                        <th class="border px-2 py-1 "># Employees</th>
                        <th class="border px-[15px] py-1 w-13">Delete</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Rows will be rendered by JS -->
                </tbody>
            </table>
            <div id="updateModal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 hidden">
                <div class="bg-white p-6 rounded shadow-lg w-80">
                    <h3 class="text-lg font-bold mb-4">Update Shift</h3>
                    <div class="mb-2">
                        <label class="block mb-1">From</label>
                        <input type="time" id="updateFrom" class="border rounded px-2 py-1 w-full" />
                    </div>
                    <div class="mb-2">
                        <label class="block mb-1">To</label>
                        <input type="time" id="updateTo" class="border rounded px-2 py-1 w-full" />
                    </div>
                    <div class="mb-4">
                        <label class="block mb-1"># Employees</label>
                        <input type="number" id="updateEmployees" min="1" class="border rounded px-2 py-1 w-full" />
                    </div>
                    <div class="flex justify-end gap-2">
                        <button id="cancelUpdateBtn" class="bg-gray-400 text-white px-3 py-1 rounded">Cancel</button>
                        <button id="saveUpdateBtn" class="bg-green-600 text-white px-3 py-1 rounded">Save</button>
                    </div>
                </div>
            </div>
        </form>
    </div>
    <script>
        window.shiftTypes = @json($shiftTypes);
        window.dateRange = @json($dateRange);
        window.staticJwt = @json(session('jwt_token') ?? (auth()->user()->jwt ?? null));
        window.shiftSchedule = @json($shiftSchedule ?? []);
    </script>
    @vite(['resources/js/step3.js'])
@endsection

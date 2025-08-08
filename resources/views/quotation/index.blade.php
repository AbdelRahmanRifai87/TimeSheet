@extends('layouts.app')

@section('content')
<div class="container mx-auto px-4 py-6">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-[#2679b5]">Quotations</h1>
        <button type="button" id="openCreateModal" class="bg-[#87b87f] hover:bg-lime-700 text-white px-6 py-2 rounded">
            Create New Quotation
        </button>
    </div>

    @if(session('success'))
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {{ session('success') }}
        </div>
    @endif

    @if($quotations->count() > 0)
        <div class="bg-white shadow-md rounded-lg overflow-hidden">
            <table class="w-full table-auto">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    @foreach($quotations as $quotation)
                        <tr class="hover:bg-gray-50" data-id="{{ $quotation->id }}">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="group">
                                    <div class="editable-field" data-field="name">
                                        <span class="display-value text-sm font-medium text-gray-900">{{ $quotation->name }}</span>
                                        <input type="text" class="edit-input hidden mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500" value="{{ $quotation->name }}">
                                    </div>
                                    @if($quotation->description)
                                    <div class="editable-field mt-1 opacity-0 max-h-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:max-h-40" data-field="description">
                                        <span class="display-value text-sm text-gray-500">
                                            {{ Str::limit($quotation->description, 50) }}
                                        </span>
                                        <textarea class="edit-input hidden mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500" rows="2">{{ $quotation->description }}</textarea>
                                    </div>
                                @endif
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div class="editable-field" data-field="client_name">
                                    <span class="display-value">{{ $quotation->client_name ?? 'N/A' }}</span>
                                    <input type="text" class="edit-input hidden mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500" value="{{ $quotation->client_name }}">
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="editable-field" data-field="status">
                                    <span class="display-value inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                                        {{ $quotation->status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800' }}">
                                        {{ ucfirst($quotation->status) }}
                                    </span>
                                    <select class="edit-input hidden mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500">
                                        <option value="draft" {{ $quotation->status === 'draft' ? 'selected' : '' }}>Draft</option>
                                        <option value="finalized" {{ $quotation->status === 'finalized' ? 'selected' : '' }}>Finalized</option>
                                    </select>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {{ $quotation->created_at->format('M d, Y') }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <a href="{{ route('quotation.schedule', $quotation) }}" 
                                   class="text-[#2679b5] hover:text-blue-900 mr-3">
                                    Setup Schedule
                                </a>

                                <button type="button" class="edit-btn text-blue-600 mr-3" title="Edit Row">
                                    <i class="fas fa-edit text-yellow-600"></i>
                                </button>
                                
                                <button type="button" class="save-btn hidden text-green-600 mr-3" title="Save Changes">
                                    <i class="fas fa-check text-green-600"></i>
                                </button>
                                
                                <button type="button" class="cancel-btn hidden text-gray-600 mr-3" title="Cancel Edit">
                                    <i class="fas fa-times text-gray-600"></i>
                                </button>
                                
                                <button type="button" class="delete-btn text-red-600" title="Delete">
                                    <i class="fa-solid fa-trash-can text-[#cf4c3f]"></i>
                                </button>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="mt-6">
            {{ $quotations->links() }}
        </div>
    @else
        <div class="bg-white shadow-md rounded-lg p-6 text-center">
            <div class="text-gray-500 mb-4">
                <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No quotations found</h3>
            <p class="text-gray-500 mb-4">Get started by creating your first quotation.</p>
            <button type="button" id="openCreateModalEmpty" class="bg-[#87b87f] hover:bg-lime-700 text-white px-6 py-2 rounded">
                Create New Quotation
            </button>
        </div>
    @endif
</div>

<!-- Create Quotation Modal -->
<div id="createQuotationModal" class="hidden fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 relative">
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-6 border-b">
            <h2 class="text-xl font-bold text-[#2679b5]">Create New Quotation</h2>
            <button type="button" id="closeCreateModal" class="text-gray-500 hover:text-gray-700 text-2xl">
                &times;
            </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6">
            <form id="createQuotationForm" class="space-y-4">
                @csrf
                <!-- Quotation Name -->
                <div>
                    <label for="modal_quotation_name" class="block text-sm font-medium text-gray-700">Quotation Name</label>
                    <input type="text" id="modal_quotation_name" name="quotation_name"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500"
                        required>
                    <div class="text-red-500 text-sm mt-1 hidden" id="name_error"></div>
                </div>

                <!-- Client Information -->
                <div>
                    <label for="modal_client_name" class="block text-sm font-medium text-gray-700">Client Name</label>
                    <input type="text" id="modal_client_name" name="client_name"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500">
                    <div class="text-red-500 text-sm mt-1 hidden" id="client_name_error"></div>
                </div>

                <!-- Status -->
                <div>
                    <label for="modal_status" class="block text-sm font-medium text-gray-700">Status</label>
                    <select id="modal_status" name="status"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500">
                        <option value="draft">Draft</option>
                        <option value="finalized">Finalized</option>
                    </select>
                    <div class="text-red-500 text-sm mt-1 hidden" id="status_error"></div>
                </div>

                <!-- Description -->
                <div>
                    <label for="modal_description" class="block text-sm font-medium text-gray-700">Description</label>
                    <textarea id="modal_description" name="description" rows="3"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500"></textarea>
                    <div class="text-red-500 text-sm mt-1 hidden" id="description_error"></div>
                </div>
            </form>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end gap-4 p-6 border-t">
            <button type="button" id="cancelCreateModal" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded">
                Cancel
            </button>
            <button type="button" id="createQuotationBtn" class="bg-[#87b87f] hover:bg-lime-700 text-white px-6 py-2 rounded">
                Create & Setup Schedule
            </button>
        </div>
    </div>
</div>

@vite(['resources/js/index.js'])

@endsection

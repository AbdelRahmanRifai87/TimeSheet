
document.addEventListener('DOMContentLoaded', function() {
    // CSRF token for AJAX requests
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (!csrfToken) {
        console.error('CSRF token not found');
        return;
    }



    // Delete functionality
    document.querySelectorAll('.delete-btn').forEach(deleteBtn => {
        deleteBtn.addEventListener('click', function() {
            const row = this.closest('tr');
            deleteQuotation(row);
        });
    });



    function deleteQuotation(row) {
        if (!confirm('Are you sure you want to delete this quotation? This action cannot be undone and will remove all related data.')) {
            return;
        }

        const quotationId = row.dataset.id;

        fetch(`/quotation/${quotationId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Clear all localStorage data related to this quotation
                clearQuotationLocalStorage(quotationId);
                
                // Remove the row from table
                row.remove();
                showAlert('success', data.message);
                
                // Check if table is empty and reload if needed
                const tbody = document.querySelector('tbody');
                if (tbody && tbody.children.length === 0) {
                    location.reload();
                }
            } else {
                showAlert('error', data.message || 'Error deleting quotation');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('error', 'Network error occurred');
        });
    }

    // Function to clear all localStorage data related to a specific quotation
    function clearQuotationLocalStorage(quotationId) {
        console.log(`Clearing localStorage data for quotation ID: ${quotationId}`);
        
        const keysToRemove = [];
        
        // Find all localStorage keys related to this quotation
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.includes(`quotation${quotationId}_`) ||
                key.includes(`quotation_${quotationId}_`) ||
                key.includes(`records_quotation_${quotationId}`) ||
                key.includes(`shifts_quotation_${quotationId}`) ||
                key.includes(`location_data_quotation_${quotationId}`) ||
                key.startsWith(`quotation${quotationId}`) ||
                key.startsWith(`quotation_${quotationId}`)
            )) {
                keysToRemove.push(key);
            }
        }
        
        // Also check for location-specific records that might be related to this quotation
        // Pattern: records_locationId where we need to check if it belongs to this quotation
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('records_') && key.match(/^records_\d+$/)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    // If the data has quotation information and matches our quotation ID
                    if (data && Array.isArray(data) && data.length > 0) {
                        // Check if any record in the array belongs to this quotation
                        const belongsToQuotation = data.some(record => 
                            record && (
                                record.quotationId == quotationId ||
                                record.quotation_id == quotationId ||
                                (record.id && record.id.includes(`quotation${quotationId}`))
                            )
                        );
                        if (belongsToQuotation) {
                            keysToRemove.push(key);
                        }
                    }
                } catch (e) {
                    // If we can't parse the data, skip it
                    console.warn(`Could not parse localStorage data for key: ${key}`);
                }
            }
        }
        
        // Remove all identified keys
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`Removed localStorage key: ${key}`);
        });
        
        // Also clear any global records object if it exists and contains data for this quotation
        if (window.records && typeof window.records === 'object') {
            Object.keys(window.records).forEach(locationId => {
                if (window.records[locationId] && Array.isArray(window.records[locationId])) {
                    const filteredRecords = window.records[locationId].filter(record => 
                        record && !(
                            record.quotationId == quotationId ||
                            record.quotation_id == quotationId ||
                            (record.id && record.id.includes(`quotation${quotationId}`))
                        )
                    );
                    
                    // If all records were removed, clear the location entirely
                    if (filteredRecords.length === 0) {
                        delete window.records[locationId];
                        console.log(`Cleared window.records for location: ${locationId}`);
                    } else if (filteredRecords.length !== window.records[locationId].length) {
                        window.records[locationId] = filteredRecords;
                        console.log(`Filtered window.records for location: ${locationId}`);
                    }
                }
            });
        }
        
        console.log(`Successfully cleared ${keysToRemove.length} localStorage items for quotation ${quotationId}`);
    }

    function showAlert(type, message) {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `fixed top-4 right-4 px-4 py-3 rounded mb-4 z-50 ${
            type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'
        }`;
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        // Remove alert after 3 seconds
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }



    // Modal functionality for creating new quotations
    const createModal = document.getElementById('createQuotationModal');
    const openCreateModalBtn = document.getElementById('openCreateModal');
    const closeCreateModalBtn = document.getElementById('closeCreateModal');
    const cancelCreateModalBtn = document.getElementById('cancelCreateModal');
    const createQuotationBtn = document.getElementById('createQuotationBtn');
    const createForm = document.getElementById('createQuotationForm');

    // Open modal
    openCreateModalBtn?.addEventListener('click', function() {
        createModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });

    // Open modal from empty state
    document.getElementById('openCreateModalEmpty')?.addEventListener('click', function() {
        createModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });

    // Close modal functions
    function closeModal() {
        createModal.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Restore scrolling
        resetForm();
    }

    closeCreateModalBtn?.addEventListener('click', closeModal);
    cancelCreateModalBtn?.addEventListener('click', closeModal);

    // Close modal on backdrop click
    createModal?.addEventListener('click', function(e) {
        if (e.target === createModal) {
            closeModal();
        }
    });

    // Close modal on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !createModal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Reset form
    function resetForm() {
        // Clear all input, select, and textarea values in the modal (but do not hide asterisks)
        document.querySelectorAll('#createQuotationForm input, #createQuotationForm select, #createQuotationForm textarea').forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else {
                input.value = '';
            }
            input.classList.remove('border-red-500');
        });
        // Clear error message text but do not hide the elements
        document.querySelectorAll('#createQuotationForm .field-error-message').forEach(error => {
            error.textContent = '';
        });
    }

    // Create quotation functionality
    createQuotationBtn?.addEventListener('click', function() {
        // Validate all required fields before duplicate check
        let hasError = false;
        // Quotation Name
        const nameInput = document.getElementById('modal_quotation_name');
        const nameError = document.getElementById('name_error');
        if (!nameInput.value.trim()) {
            nameInput.classList.add('border-red-500');
            if (nameError) {
                nameError.textContent = 'Quotation name is required.';
                nameError.classList.remove('hidden');
            }
            hasError = true;
        }
        // Client Name
        const clientInput = document.getElementById('modal_client_name');
        const clientError = document.getElementById('client_name_error');
        if (!clientInput.value.trim()) {
            clientInput.classList.add('border-red-500');
            if (clientError) {
                clientError.textContent = 'Client name is required.';
                clientError.classList.remove('hidden');
            }
            hasError = true;
        }
        // Status (should always have a value, but check anyway)
        const statusInput = document.getElementById('modal_status');
        const statusError = document.getElementById('status_error');
        if (!statusInput.value) {
            statusInput.classList.add('border-red-500');
            if (statusError) {
                statusError.textContent = 'Status is required.';
                statusError.classList.remove('hidden');
            }
            hasError = true;
        }
        // If any error, prevent submission
        if (hasError) return;

        // Get the new quotation name (trimmed, case-insensitive)
        const newName = nameInput.value.trim().toLowerCase();
        let duplicate = false;
        // Check all existing quotation names in the table
        document.querySelectorAll('tbody tr .editable-field[data-field="name"] .display-value').forEach(span => {
            if (span.textContent.trim().toLowerCase() === newName) {
                duplicate = true;
            }
        });
        // If duplicate, show error and prevent submission
        if (duplicate) {
            if (nameError) {
                nameError.textContent = 'A quotation with this name already exists.';
                nameError.classList.remove('hidden');
            }
            nameInput.classList.add('border-red-500');
            return;
        }

        const formData = new FormData(createForm);
        // Disable button and show loading state
        createQuotationBtn.disabled = true;
        createQuotationBtn.textContent = 'Creating...';
        // Clear previous errors (only error messages, not asterisks)
        document.querySelectorAll('#createQuotationForm .field-error-message').forEach(error => {
            error.textContent = '';
        });
        document.querySelectorAll('#createQuotationForm input, #createQuotationForm select, #createQuotationForm textarea').forEach(input => {
            input.classList.remove('border-red-500');
        });

        fetch('/quotation', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken,
                'Accept': 'application/json'
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('success', 'Quotation created successfully!');
                // Add new quotation to table
                addQuotationToTable(data.quotation);
                closeModal();
            } else {
                // Handle validation errors
                if (data.errors) {
                    // Show all error messages and red borders for all fields with errors
                    Object.keys(data.errors).forEach(field => {
                        const errorElement = document.getElementById(`${field}_error`);
                        const inputElement = document.getElementById(`modal_${field}`);
                        if (errorElement) {
                            errorElement.textContent = data.errors[field][0];
                        }
                        if (inputElement) {
                            inputElement.classList.add('border-red-500');
                        }
                    });
                } else {
                    showAlert('error', data.message || 'Error creating quotation');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('error', 'Network error occurred');
        })
        .finally(() => {
            // Restore button state
            createQuotationBtn.disabled = false;
            createQuotationBtn.textContent = 'Create & Setup Schedule';
        });
    });

    // Add real-time validation
    document.getElementById('modal_quotation_name')?.addEventListener('input', function() {
        if (this.value.trim().length > 0) {
            this.classList.remove('border-red-500');
            document.getElementById('name_error')?.classList.add('hidden');
        }
    });

    // Function to add new quotation to table
    function addQuotationToTable(quotation) {
        const tbody = document.querySelector('tbody');
        const emptyState = document.querySelector('.bg-white.shadow-md.rounded-lg.p-6.text-center');
        
        // If empty state exists, remove it and create table
        if (emptyState && !tbody) {
            emptyState.parentElement.innerHTML = `
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
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        const newTbody = document.querySelector('tbody');
        if (newTbody) {
            const statusBadge = quotation.status === 'sent to client' ? 
                'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.setAttribute('data-id', quotation.id);
            
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="group">
                        <div class="editable-field" data-field="name">
                            <span class="display-value text-sm font-medium text-gray-900">${quotation.name}</span>
                            <input type="text" class="edit-input hidden mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500" value="${quotation.name}">
                        </div>
                        <div class="editable-field mt-1 opacity-0 max-h-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:max-h-40" data-field="description">
                            <span class="display-value text-sm text-gray-500">${quotation.description ? (quotation.description.length > 50 ? quotation.description.substring(0, 50) + '...' : quotation.description) : 'No description'}</span>
                            <textarea class="edit-input hidden mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500" rows="2">${quotation.description || ''}</textarea>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div class="editable-field" data-field="client_name">
                        <span class="display-value">${quotation.client_name || 'N/A'}</span>
                        <input type="text" class="edit-input hidden mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500" value="${quotation.client_name || ''}">
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="editable-field" data-field="status">
                        <span class="display-value inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusBadge}">
                            ${quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                        </span>
                        <select class="edit-input hidden mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500">
                            <option value="in_progress" ${quotation.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                            <option value="finalized" ${quotation.status === 'finalized' ? 'selected' : ''}>Finalized</option>
                            <option value="sent to client" ${quotation.status === 'sent to client' ? 'selected' : ''}>sent to client</option>
                        </select>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="/quotation/${quotation.id}/schedule?edit=1" class="text-[#2679b5] hover:text-blue-900 mr-3">
                        Edit Quotation
                    </a>
                    <button type="button" class="delete-btn text-red-600" title="Delete">
                        <i class="fa-solid fa-trash-can text-[#cf4c3f]"></i>
                    </button>
                </td>
            `;
            
            // Add event listeners to the new row
            addEventListenersToRow(row);
            
            // Add to top of table
            newTbody.insertBefore(row, newTbody.firstChild);
        }
    }

    // Function to add event listeners to a row when created
    function addEventListenersToRow(row) {
        const deleteBtn = row.querySelector('.delete-btn');
        deleteBtn?.addEventListener('click', () => deleteQuotation(row));
        
        // Add row click functionality for summary display
        row.addEventListener('click', function(e) {
            // Prevent summary from opening if clicking on a button or link inside the row
            const target = e.target;
            if (target.closest('a, button')) {
                return;
            }
            
            // Dismiss any existing warning messages when clicking on a new row
            const existingWarning = document.querySelector('.quotation-warning');
            if (existingWarning) {
                existingWarning.remove();
            }
            
            const id = row.getAttribute('data-id');
            
            // Get selected locations first to check if we have data
            let selectedLocations = [];
            try {
                const key = `quotation${id}_selected_locations`;
                const data = localStorage.getItem(key);
                if (data) {
                    selectedLocations = JSON.parse(data);
                }
            } catch (e) {}
            
            // Get description
            let description = '';
            try {
                const descSpan = row.querySelector('.editable-field[data-field="description"] .display-value');
                if (descSpan) {
                    const descText = descSpan.textContent.trim();
                    if (descText && descText !== 'No description') {
                        description = descText;
                    }
                }
            } catch (e) {}

            // Check if there is any meaningful data
            let hasData = false;
            let totalShifts = 0;
            let totalBillable = 0;
            
            if (selectedLocations.length > 0) {
                selectedLocations.forEach(locationId => {
                    let records = [];
                    let keysToTry = [
                        `records_${locationId}`,
                        `quotation_${id}selectedlocations${locationId}Records`
                    ];
                    for (const key of keysToTry) {
                        try {
                            const recData = localStorage.getItem(key);
                            if (recData) {
                                records = JSON.parse(recData);
                                if (Array.isArray(records) && records.length > 0) break;
                            }
                        } catch (e) {}
                    }
                    const filteredRecords = Array.isArray(records)
                        ? records.filter(r =>
                            (r.quotationId == id || r.quotation_id == id || (r.id && r.id.includes(`quotation${id}`))) &&
                            (r.locationId == locationId || r.location_id == locationId)
                        )
                        : [];
                    const uniqueGroupedIds = new Set(filteredRecords.map(r => r.groupedId));
                    totalShifts += uniqueGroupedIds.size;
                    
                    // Check for billable amount
                    try {
                        const billableKey = `quotation${id}_location${locationId}_total_billable`;
                        const billableData = localStorage.getItem(billableKey);
                        if (billableData) {
                            const parsed = JSON.parse(billableData);
                            if (parsed && typeof parsed.billable === 'number') {
                                totalBillable += parsed.billable;
                            }
                        }
                    } catch (e) {}
                });
                hasData = selectedLocations.length > 0 || totalShifts > 0 || totalBillable > 0 || description;
            } else {
                hasData = !!description;
            }

            // Show warning message instead of expanding empty row
            if (!hasData) {
                showWarningMessage('No data has been added to this quotation yet. Click "Edit Quotation" to add locations and configure shifts.');
                return;
            } else if (selectedLocations.length === 0) {
                showWarningMessage('No locations selected for this quotation. Click "Edit Quotation" to select locations.');
                return;
            }

            // Only proceed with summary if we have actual data
            let summaryRow = document.getElementById('quotation-summary-' + id);
            if (!summaryRow) {
                // Create summary row if it doesn't exist
                summaryRow = document.createElement('tr');
                summaryRow.id = 'quotation-summary-' + id;
                summaryRow.className = 'quotation-summary-row';
                const td = document.createElement('td');
                td.colSpan = row.children.length;
                td.innerHTML = `<div id="summary-content-${id}"></div>`;
                summaryRow.appendChild(td);
                row.parentNode.insertBefore(summaryRow, row.nextSibling);
            }
            
            if (summaryRow.classList.contains('hidden')) {
                // Hide all other summaries and remove animation class
                document.querySelectorAll('.quotation-summary-row').forEach(r => {
                    r.classList.add('hidden');
                    r.classList.remove('fade-in-summary');
                });
                // Show this one with animation
                summaryRow.classList.remove('hidden');
                // Force reflow for animation
                void summaryRow.offsetWidth;
                summaryRow.classList.add('fade-in-summary');
                
                // Fill summary with actual data
                const summaryDiv = document.getElementById('summary-content-' + id);
                let allDaysSet = new Set();
                let allStartDates = [];
                let allEndDates = [];

                selectedLocations.forEach(locationId => {
                    let records = [];
                    let keysToTry = [
                        `records_${locationId}`,
                        `quotation_${id}selectedlocations${locationId}Records`
                    ];
                    for (const key of keysToTry) {
                        try {
                            const recData = localStorage.getItem(key);
                            if (recData) {
                                records = JSON.parse(recData);
                                if (Array.isArray(records) && records.length > 0) break;
                            }
                        } catch (e) {}
                    }
                    const filteredRecords = Array.isArray(records)
                        ? records.filter(r =>
                            (r.quotationId == id || r.quotation_id == id || (r.id && r.id.includes(`quotation${id}`))) &&
                            (r.locationId == locationId || r.location_id == locationId)
                        )
                        : [];
                    
                    filteredRecords.forEach(record => {
                        if (record.dateRange) {
                            const match = record.dateRange.match(/(\d{2}-\d{2}-\d{2})\s+to\s+(\d{2}-\d{2}-\d{2})/);
                            if (match) {
                                const start = match[1];
                                const end = match[2];
                                const parseDate = d => {
                                    const [yy, mm, dd] = d.split('-');
                                    return new Date(2000 + parseInt(yy), parseInt(mm) - 1, parseInt(dd));
                                };
                                let current = parseDate(start);
                                const endDate = parseDate(end);
                                allStartDates.push(current.getTime());
                                allEndDates.push(endDate.getTime());
                                while (current <= endDate) {
                                    const y = String(current.getFullYear()).slice(-2);
                                    const m = String(current.getMonth() + 1).padStart(2, '0');
                                    const d = String(current.getDate()).padStart(2, '0');
                                    allDaysSet.add(`${y}-${m}-${d}`);
                                    current.setDate(current.getDate() + 1);
                                }
                            }
                        }
                    });
                });

                let summaryHtml = '';
                summaryHtml += `<div class='font-medium text-gray-800 bg-gray-50 rounded-lg p-4 shadow-sm flex flex-col gap-2 w-full border border-gray-200'>`;
                summaryHtml += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100'><i class='fas fa-map-marker-alt text-blue-500'></i></span><span class='text-blue-700 font-semibold text-lg'>Total Number of Locations:</span> <span class='ml-1 text-gray-700 font-semibold'>${selectedLocations.length}</span></div>`;
                summaryHtml += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100'><i class='fas fa-layer-group text-green-500'></i></span><span class='text-green-700 font-semibold text-lg'>Number of shifts:</span> <span class='ml-1 text-gray-700 font-semibold'>${totalShifts}</span></div>`;
                summaryHtml += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100'><i class='fas fa-dollar-sign text-indigo-500'></i></span><span class='text-indigo-700 font-semibold text-lg'>Total amount:</span> <span class='ml-1 text-gray-700 font-semibold'>$${totalBillable.toLocaleString()}</span></div>`;
                summaryHtml += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100'><i class='fas fa-calendar-day text-purple-500'></i></span><span class='text-purple-700 font-semibold text-lg'>Number of days:</span> <span class='ml-1 text-gray-700 font-semibold'>${allDaysSet.size}</span></div>`;
                
                // Date range
                let dateRangeHtml = '';
                if (allStartDates.length > 0 && allEndDates.length > 0) {
                    const minStart = new Date(Math.min(...allStartDates));
                    const maxEnd = new Date(Math.max(...allEndDates));
                    const formatDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    dateRangeHtml = `${formatDate(minStart)} to ${formatDate(maxEnd)}`;
                }
                if (dateRangeHtml) {
                    summaryHtml += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100'><i class='fas fa-calendar-alt text-orange-500'></i></span><span class='text-orange-700 font-semibold'>Date Range:</span> <span class='ml-1 text-gray-700'>${dateRangeHtml}</span></div>`;
                }
                
                // Always show description section
                summaryHtml += `<div class='flex items-start gap-2 mt-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200'><i class='fas fa-info-circle text-blue-400'></i></span><div><span class='font-semibold text-gray-700'>Description:</span><div class='text-gray-600 mt-1'>${description || 'No description'}</div></div></div>`;
                summaryHtml += `</div>`;
                summaryDiv.innerHTML = summaryHtml;

                let html = '';
                html += `<div class='font-medium text-gray-800 bg-gray-50 rounded-lg p-4 shadow-sm flex flex-col gap-2 w-full border border-gray-200'>`;
                if (!hasData) {
                    html += `<div class='text-gray-500 text-center'>No data has been added to this quotation yet.</div>`;
                } else if (selectedLocations.length === 0) {
                    html += `<div class='text-gray-500 text-center'>No location is selected.</div>`;
                } else {
                    html += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100'><i class='fas fa-map-marker-alt text-blue-500'></i></span><span class='text-blue-700 font-semibold text-lg'>Total Number of Locations:</span> <span class='ml-1 text-gray-700 font-semibold'>${selectedLocations.length}</span></div>`;
                    html += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100'><i class='fas fa-layer-group text-green-500'></i></span><span class='text-green-700 font-semibold text-lg'>Number of shifts:</span> <span class='ml-1 text-gray-700 font-semibold'>${totalShifts}</span></div>`;
                    html += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100'><i class='fas fa-dollar-sign text-indigo-500'></i></span><span class='text-indigo-700 font-semibold text-lg'>Total amount:</span> <span class='ml-1 text-gray-700 font-semibold'>$${totalBillable.toLocaleString()}</span></div>`;
                    html += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100'><i class='fas fa-calendar-day text-purple-500'></i></span><span class='text-purple-700 font-semibold text-lg'>Number of days:</span> <span class='ml-1 text-gray-700 font-semibold'>${allDaysSet.size}</span></div>`;
                    // Date range
                    let dateRangeHtml = '';
                    if (allStartDates.length > 0 && allEndDates.length > 0) {
                        const minStart = new Date(Math.min(...allStartDates));
                        const maxEnd = new Date(Math.max(...allEndDates));
                        const formatDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        dateRangeHtml = `${formatDate(minStart)} to ${formatDate(maxEnd)}`;
                    }
                    if (dateRangeHtml) {
                        html += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100'><i class='fas fa-calendar-alt text-orange-500'></i></span><span class='text-orange-700 font-semibold'>Date Range:</span> <span class='ml-1 text-gray-700'>${dateRangeHtml}</span></div>`;
                    }
                    // Always show description section
                    html += `<div class='flex items-start gap-2 mt-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200'><i class='fas fa-info-circle text-blue-400'></i></span><div><span class='font-semibold text-gray-700'>Description:</span><div class='text-gray-600 mt-1'>${description || 'No description'}</div></div></div>`;
                }
                html += `</div>`;
                summaryDiv.innerHTML = html;
            } else {
                summaryRow.classList.add('hidden');
                summaryRow.classList.remove('fade-in-summary');
            }
            // Inject summary animation CSS if not present
            if (!document.getElementById('summary-animation-style')) {
                const style = document.createElement('style');
                style.id = 'summary-animation-style';
                style.innerHTML = `
                    .fade-in-summary {
                        animation: fadeInSummary 0.35s cubic-bezier(0.4,0,0.2,1);
                        transition: background 0.3s;
                    }
                    @keyframes fadeInSummary {
                        from {
                            opacity: 0;
                            transform: translateY(-10px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        });
    }

document.querySelectorAll('tr[data-id]').forEach(function(row) {
    row.addEventListener('click', function(e) {
        // Prevent summary from opening if clicking on a button or link inside the row
        const target = e.target;
        if (target.closest('a, button')) {
            return;
        }
        
        // Dismiss any existing warning messages when clicking on a new row
        const existingWarning = document.querySelector('.quotation-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        const id = row.getAttribute('data-id');
        
        // Get selected locations first to check if we have data
        let selectedLocations = [];
        try {
            const key = `quotation${id}_selected_locations`;
            const data = localStorage.getItem(key);
            if (data) {
                selectedLocations = JSON.parse(data);
            }
        } catch (e) {}
        
        // Get description
        let description = '';
        try {
            const descSpan = row.querySelector('.editable-field[data-field="description"] .display-value');
            if (descSpan) {
                const descText = descSpan.textContent.trim();
                if (descText && descText !== 'No description') {
                    description = descText;
                }
            }
        } catch (e) {}

        // Check if there is any meaningful data
        let hasData = false;
        let totalShifts = 0;
        let totalBillable = 0;
        let allDaysSet = new Set();
        let allStartDates = [];
        let allEndDates = [];
        
        if (selectedLocations.length > 0) {
            selectedLocations.forEach(locationId => {
                let records = [];
                let keysToTry = [
                    `records_${locationId}`,
                    `quotation_${id}selectedlocations${locationId}Records`
                ];
                for (const key of keysToTry) {
                    try {
                        const recData = localStorage.getItem(key);
                        if (recData) {
                            records = JSON.parse(recData);
                            if (Array.isArray(records) && records.length > 0) break;
                        }
                    } catch (e) {}
                }
                const filteredRecords = Array.isArray(records)
                    ? records.filter(r =>
                        (r.quotationId == id || r.quotation_id == id || (r.id && r.id.includes(`quotation${id}`))) &&
                        (r.locationId == locationId || r.location_id == locationId)
                    )
                    : [];
                const uniqueGroupedIds = new Set(filteredRecords.map(r => r.groupedId));
                totalShifts += uniqueGroupedIds.size;
                
                filteredRecords.forEach(record => {
                    if (record.dateRange) {
                        const match = record.dateRange.match(/(\d{2}-\d{2}-\d{2})\s+to\s+(\d{2}-\d{2}-\d{2})/);
                        if (match) {
                            const start = match[1];
                            const end = match[2];
                            const parseDate = d => {
                                const [yy, mm, dd] = d.split('-');
                                return new Date(2000 + parseInt(yy), parseInt(mm) - 1, parseInt(dd));
                            };
                            let current = parseDate(start);
                            const endDate = parseDate(end);
                            allStartDates.push(current.getTime());
                            allEndDates.push(endDate.getTime());
                            while (current <= endDate) {
                                const y = String(current.getFullYear()).slice(-2);
                                const m = String(current.getMonth() + 1).padStart(2, '0');
                                const d = String(current.getDate()).padStart(2, '0');
                                allDaysSet.add(`${y}-${m}-${d}`);
                                current.setDate(current.getDate() + 1);
                            }
                        }
                    }
                });
                
                // Check for billable amount
                try {
                    const billableKey = `quotation${id}_location${locationId}_total_billable`;
                    const billableData = localStorage.getItem(billableKey);
                    if (billableData) {
                        const parsed = JSON.parse(billableData);
                        if (parsed && typeof parsed.billable === 'number') {
                            totalBillable += parsed.billable;
                        }
                    }
                } catch (e) {}
            });
            hasData = selectedLocations.length > 0 || totalShifts > 0 || totalBillable > 0 || allDaysSet.size > 0 || description;
        } else {
            hasData = !!description;
        }

        // Show warning message instead of expanding empty row
        if (!hasData) {
            showWarningMessage('No data has been added to this quotation yet. Click "Edit Quotation" to add locations and configure shifts.');
            return;
        } else if (selectedLocations.length === 0) {
            showWarningMessage('No locations selected for this quotation. Click "Edit Quotation" to select locations.');
            return;
        }

        // Only proceed with summary if we have actual data
        let summaryRow = document.getElementById('quotation-summary-' + id);
        if (!summaryRow) {
            // Create summary row if it doesn't exist
            summaryRow = document.createElement('tr');
            summaryRow.id = 'quotation-summary-' + id;
            summaryRow.className = 'quotation-summary-row';
            const td = document.createElement('td');
            td.colSpan = row.children.length;
            td.innerHTML = `<div id="summary-content-${id}"></div>`;
            summaryRow.appendChild(td);
            row.parentNode.insertBefore(summaryRow, row.nextSibling);
        }
        
        if (summaryRow.classList.contains('hidden')) {
            // Hide all other summaries and remove animation class
            document.querySelectorAll('.quotation-summary-row').forEach(r => {
                r.classList.add('hidden');
                r.classList.remove('fade-in-summary');
            });
            // Show this one with animation
            summaryRow.classList.remove('hidden');
            // Force reflow for animation
            void summaryRow.offsetWidth;
            summaryRow.classList.add('fade-in-summary');
            
            // Fill summary with actual data
            const summaryDiv = document.getElementById('summary-content-' + id);

            let html = '';
            html += `<div class='font-medium text-gray-800 bg-gray-50 rounded-lg p-4 shadow-sm flex flex-col gap-2 w-full border border-gray-200'>`;
            if (!hasData) {
                html += `<div class='text-gray-500 text-center'>No data has been added to this quotation yet.</div>`;
            } else if (selectedLocations.length === 0) {
                html += `<div class='text-gray-500 text-center'>No location is selected.</div>`;
            } else {
                html += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100'><i class='fas fa-map-marker-alt text-blue-500'></i></span><span class='text-blue-700 font-semibold text-lg'>Selected Locations:</span> <span class='ml-1 text-gray-700 font-semibold'>${selectedLocations.length}</span></div>`;
                html += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100'><i class='fas fa-layer-group text-green-500'></i></span><span class='text-green-700 font-semibold text-lg'>Number of shifts:</span> <span class='ml-1 text-gray-700 font-semibold'>${totalShifts}</span></div>`;
                html += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100'><i class='fas fa-dollar-sign text-indigo-500'></i></span><span class='text-indigo-700 font-semibold text-lg'>Total amount:</span> <span class='ml-1 text-gray-700 font-semibold'>$${totalBillable.toLocaleString()}</span></div>`;
                html += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100'><i class='fas fa-calendar-day text-purple-500'></i></span><span class='text-purple-700 font-semibold text-lg'>Number of days:</span> <span class='ml-1 text-gray-700 font-semibold'>${allDaysSet.size}</span></div>`;
                // Date range
                let dateRangeHtml = '';
                if (allStartDates.length > 0 && allEndDates.length > 0) {
                    const minStart = new Date(Math.min(...allStartDates));
                    const maxEnd = new Date(Math.max(...allEndDates));
                    const formatDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    dateRangeHtml = `${formatDate(minStart)} to ${formatDate(maxEnd)}`;
                }
                if (dateRangeHtml) {
                    html += `<div class='flex items-center gap-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100'><i class='fas fa-calendar-alt text-orange-500'></i></span><span class='text-orange-700 font-semibold'>Date Range:</span> <span class='ml-1 text-gray-700'>${dateRangeHtml}</span></div>`;
                }
                // Always show description section
                html += `<div class='flex items-start gap-2 mt-2'><span class='inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-200'><i class='fas fa-info-circle text-blue-400'></i></span><div><span class='font-semibold text-gray-700'>Description:</span><div class='text-gray-600 mt-1'>${description || 'No description'}</div></div></div>`;
            }
            html += `</div>`;
            summaryDiv.innerHTML = html;
        } else {
            summaryRow.classList.add('hidden');
            summaryRow.classList.remove('fade-in-summary');
        }
        // Inject summary animation CSS if not present
        if (!document.getElementById('summary-animation-style')) {
            const style = document.createElement('style');
            style.id = 'summary-animation-style';
            style.innerHTML = `
                .fade-in-summary {
                    animation: fadeInSummary 0.35s cubic-bezier(0.4,0,0.2,1);
                    transition: background 0.3s;
                }
                @keyframes fadeInSummary {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    });
});
});

// Add warning message function
function showWarningMessage(message) {
    // Remove existing warning if present
    const existingWarning = document.querySelector('.quotation-warning');
    if (existingWarning) {
        existingWarning.remove();
    }

    // Create warning element
    const warning = document.createElement('div');
    warning.className = 'quotation-warning fixed top-20 right-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
    warning.innerHTML = `
        <div class="flex items-start">
            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2 mt-0.5"></i>
            <div class="flex-1">
                <p class="text-sm">${message}</p>
            </div>
            <button class="ml-2 text-yellow-600 hover:text-yellow-800" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(warning);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (warning.parentElement) {
            warning.remove();
        }
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function () {
        // Attach click handler to all edit buttons
//         document.querySelectorAll('.edit-btn').forEach(function (editBtn) {
//             editBtn.addEventListener('click', function () {
//                 const td = editBtn.closest('td');
//                 const link = td.querySelector('.setup-schedule-link');
//                 const saveBtn = td.querySelector('.save-btn');
//                 const cancelBtn = td.querySelector('.cancel-btn');

//                 link.classList.remove('hidden');
//                 saveBtn.classList.remove('hidden');
//                 cancelBtn.classList.remove('hidden');
//                 editBtn.classList.add('hidden');
//             });
//         });

// // Attach click handler to all cancel buttons
// document.querySelectorAll('.cancel-btn').forEach(function (cancelBtn) {
//     cancelBtn.addEventListener('click', function () {
//         const td = cancelBtn.closest('td');
//         const link = td.querySelector('.setup-schedule-link');
//         const saveBtn = td.querySelector('.save-btn');
//         const editBtn = td.querySelector('.edit-btn');

//         link.classList.add('hidden');
//         saveBtn.classList.add('hidden');
//         cancelBtn.classList.add('hidden');
//         editBtn.classList.remove('hidden');
//     });
// });
});

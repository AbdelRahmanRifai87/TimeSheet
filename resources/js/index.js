
document.addEventListener('DOMContentLoaded', function() {
    // CSRF token for AJAX requests
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (!csrfToken) {
        console.error('CSRF token not found');
        return;
    }

    // Edit functionality
    document.querySelectorAll('.edit-btn').forEach(editBtn => {
        editBtn.addEventListener('click', function() {
            const row = this.closest('tr');
            enableEditMode(row);
        });
    });

    // Save functionality
    document.querySelectorAll('.save-btn').forEach(saveBtn => {
        saveBtn.addEventListener('click', function() {
            const row = this.closest('tr');
            saveChanges(row);
        });
    });

    // Cancel functionality
    document.querySelectorAll('.cancel-btn').forEach(cancelBtn => {
        cancelBtn.addEventListener('click', function() {
            const row = this.closest('tr');
            cancelEdit(row);
        });
    });

    // Delete functionality
    document.querySelectorAll('.delete-btn').forEach(deleteBtn => {
        deleteBtn.addEventListener('click', function() {
            const row = this.closest('tr');
            deleteQuotation(row);
        });
    });

    function enableEditMode(row) {
        // Hide display values and show edit inputs
        row.querySelectorAll('.display-value').forEach(span => span.classList.add('hidden'));
        row.querySelectorAll('.edit-input').forEach(input => input.classList.remove('hidden'));
        
        // Toggle buttons
        row.querySelector('.edit-btn').classList.add('hidden');
        row.querySelector('.save-btn').classList.remove('hidden');
        row.querySelector('.cancel-btn').classList.remove('hidden');
        
        // Focus on first input
        const firstInput = row.querySelector('.edit-input');
        if (firstInput) firstInput.focus();
    }

    function cancelEdit(row) {
        // Show display values and hide edit inputs
        row.querySelectorAll('.display-value').forEach(span => span.classList.remove('hidden'));
        row.querySelectorAll('.edit-input').forEach(input => input.classList.add('hidden'));
        
        // Toggle buttons
        row.querySelector('.edit-btn').classList.remove('hidden');
        row.querySelector('.save-btn').classList.add('hidden');
        row.querySelector('.cancel-btn').classList.add('hidden');
        
        // Reset input values to original
        row.querySelectorAll('.editable-field').forEach(field => {
            const input = field.querySelector('.edit-input');
            const display = field.querySelector('.display-value');
            if (input && display) {
                if (input.tagName === 'SELECT') {
                    const originalValue = display.textContent.toLowerCase().trim();
                    input.value = originalValue;
                } else {
                    input.value = display.textContent.trim();
                }
            }
        });
    }

    function saveChanges(row) {
        const quotationId = row.dataset.id;
        const formData = new FormData();
        
        // Collect data from editable fields
        row.querySelectorAll('.editable-field').forEach(field => {
            const fieldName = field.dataset.field;
            const input = field.querySelector('.edit-input');
            if (input) {
                formData.append(fieldName, input.value);
            }
        });

        // Add method override for PUT request
        formData.append('_method', 'PUT');

        fetch(`/quotation/${quotationId}`, {
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
                // Update display values with new data
                row.querySelectorAll('.editable-field').forEach(field => {
                    const fieldName = field.dataset.field;
                    const display = field.querySelector('.display-value');
                    const input = field.querySelector('.edit-input');
                    
                    if (display && input && data.quotation[fieldName] !== undefined) {
                        if (fieldName === 'status') {
                            // Update status badge
                            const statusValue = data.quotation[fieldName];
                            const badgeClass = statusValue === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
                            display.className = `display-value inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeClass}`;
                            display.textContent = statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
                        } else {
                            display.textContent = data.quotation[fieldName] || (fieldName === 'client_name' ? 'N/A' : '');
                        }
                    }
                });
                
                cancelEdit(row);
                showAlert('success', data.message);
            } else {
                showAlert('error', data.message || 'Error updating quotation');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('error', 'Network error occurred');
        });
    }

    function deleteQuotation(row) {
        if (!confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
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

    // Handle blur event for auto-save (optional)
    document.querySelectorAll('.edit-input').forEach(input => {
        input.addEventListener('blur', function() {
            // You can implement auto-save on blur here if needed
        });
        
        // Handle Enter key to save
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.tagName !== 'TEXTAREA') {
                e.preventDefault();
                const row = this.closest('tr');
                saveChanges(row);
            }
        });
        
        // Handle Escape key to cancel
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const row = this.closest('tr');
                cancelEdit(row);
            }
        });
    });

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
        createForm.reset();
        // Hide all error messages
        document.querySelectorAll('#createQuotationForm .text-red-500').forEach(error => {
            error.classList.add('hidden');
        });
        // Remove error styling from inputs
        document.querySelectorAll('#createQuotationForm input, #createQuotationForm select, #createQuotationForm textarea').forEach(input => {
            input.classList.remove('border-red-500');
        });
    }

    // Create quotation functionality
    createQuotationBtn?.addEventListener('click', function() {
        const formData = new FormData(createForm);
        
        // Disable button and show loading state
        createQuotationBtn.disabled = true;
        createQuotationBtn.textContent = 'Creating...';
        
        // Clear previous errors
        document.querySelectorAll('#createQuotationForm .text-red-500').forEach(error => {
            error.classList.add('hidden');
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
                showAlert('success', 'Quotation created successfully! Redirecting to setup schedule...');
                
                // Add new quotation to table if we're not redirecting
                addQuotationToTable(data.quotation);
                
                closeModal();
                
                // Redirect to setup schedule after short delay
                setTimeout(() => {
                    window.location.href = `/quotation/${data.quotation.id}/schedule`;
                }, 1000);
            } else {
                // Handle validation errors
                if (data.errors) {
                    Object.keys(data.errors).forEach(field => {
                        const errorElement = document.getElementById(`${field}_error`);
                        const inputElement = document.getElementById(`modal_${field}`) || document.getElementById(`modal_quotation_name`);
                        
                        if (errorElement) {
                            errorElement.textContent = data.errors[field][0];
                            errorElement.classList.remove('hidden');
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
            const statusBadge = quotation.status === 'draft' ? 
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
                        ${quotation.description ? `
                        <div class="editable-field mt-1 opacity-0 max-h-0 overflow-hidden transition-all duration-500 ease-in-out group-hover:opacity-100 group-hover:max-h-40" data-field="description">
                            <span class="display-value text-sm text-gray-500">${quotation.description.length > 50 ? quotation.description.substring(0, 50) + '...' : quotation.description}</span>
                            <textarea class="edit-input hidden mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-500" rows="2">${quotation.description}</textarea>
                        </div>
                        ` : ''}
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
                            <option value="draft" ${quotation.status === 'draft' ? 'selected' : ''}>Draft</option>
                            <option value="finalized" ${quotation.status === 'finalized' ? 'selected' : ''}>Finalized</option>
                        </select>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="/quotation/${quotation.id}/schedule" class="text-[#2679b5] hover:text-blue-900 mr-3">
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
            `;
            
            // Add event listeners to the new row
            addEventListenersToRow(row);
            
            // Add to top of table
            newTbody.insertBefore(row, newTbody.firstChild);
        }
    }

    // Function to add event listeners to a row
    function addEventListenersToRow(row) {
        const editBtn = row.querySelector('.edit-btn');
        const saveBtn = row.querySelector('.save-btn');
        const cancelBtn = row.querySelector('.cancel-btn');
        const deleteBtn = row.querySelector('.delete-btn');

        editBtn?.addEventListener('click', () => enableEditMode(row));
        saveBtn?.addEventListener('click', () => saveChanges(row));
        cancelBtn?.addEventListener('click', () => cancelEdit(row));
        deleteBtn?.addEventListener('click', () => deleteQuotation(row));

        // Add keyboard event listeners to inputs
        row.querySelectorAll('.edit-input').forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && this.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    saveChanges(row);
                }
            });
            
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    cancelEdit(row);
                }
            });
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
        // Attach click handler to all edit buttons
        document.querySelectorAll('.edit-btn').forEach(function (editBtn) {
            editBtn.addEventListener('click', function () {
                const td = editBtn.closest('td');
                const link = td.querySelector('.setup-schedule-link');
                const saveBtn = td.querySelector('.save-btn');
                const cancelBtn = td.querySelector('.cancel-btn');

                link.classList.remove('hidden');
                saveBtn.classList.remove('hidden');
                cancelBtn.classList.remove('hidden');
                editBtn.classList.add('hidden');
            });
        });

// Attach click handler to all cancel buttons
document.querySelectorAll('.cancel-btn').forEach(function (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
        const td = cancelBtn.closest('td');
        const link = td.querySelector('.setup-schedule-link');
        const saveBtn = td.querySelector('.save-btn');
        const editBtn = td.querySelector('.edit-btn');

        link.classList.add('hidden');
        saveBtn.classList.add('hidden');
        cancelBtn.classList.add('hidden');
        editBtn.classList.remove('hidden');
    });
});
});

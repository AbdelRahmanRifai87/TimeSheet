import { apiService } from "../apiService";
import {
    showToast,
    validateRequired,
    extractAxiosErrorMsg,
    showModal,
} from "../helpers";
import { SelectionManager } from "./SelectionManager";

const records = {}; // Keyed by location ID
let previousFormData = {}; // Store previous form data for each location

locations.forEach((location) => {
    records[location.id] = []; // Initialize an empty array for each location
});
// Filtering state
let filterDayValue = "";
let filterShiftTypeValue = "";

// const selectionManager = new SelectionManager();

// Show the Batch Form Modal
function showBatchFormModal(locationId) {
    const modal = document.getElementById(`batchFormModal_${locationId}`);
    modal.classList.remove("hidden");
}

// Hide the Batch Form Modal
function hideBatchFormModal(locationId) {
    console.log(`Hiding modal for location ${locationId}`);
    const modal = document.getElementById(`batchFormModal_${locationId}`);
    modal.classList.add("hidden");
}

// Populate filter dropdowns
function populateFilters() {
    const daySel = document.getElementById("filterDay");
    const shiftSel = document.getElementById("filterShiftType");

    // Populate day filter
    daySel.innerHTML =
        `<option value="">All</option>` +
        uniqueDayNames
            .map((dayName) => `<option value="${dayName}">${dayName}</option>`)
            .join("");

    // Populate shift type filter
    shiftSel.innerHTML =
        `<option value="">All</option>` +
        shiftTypes
            .map((st) => `<option value="${st.id}">${st.name}</option>`)
            .join("");
}
function getFilteredRecords(locationId) {
    return records[locationId].filter(
        (rec) =>
            (!filterDayValue || rec.day === filterDayValue) &&
            (!filterShiftTypeValue || rec.shiftType == filterShiftTypeValue)
    );
}

// Filter records based on selected day and shift type
function getGroupedRecords() {
    return records.filter(
        (rec) =>
            (!filterDayValue || rec.day === filterDayValue) &&
            (!filterShiftTypeValue || rec.shiftType == filterShiftTypeValue)
    );
}

function initializeTimePickers(locationId) {
    const fromInput = document.getElementById(`batchFrom_${locationId}`);
    const toInput = document.getElementById(`batchTo_${locationId}`);

    if (fromInput) {
        flatpickr(fromInput, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
        });
    }

    if (toInput) {
        flatpickr(toInput, {
            enableTime: true,
            noCalendar: true,
            dateFormat: "H:i",
            time_24hr: true,
        });
    }
}

function renderTable(locationId) {
    console.log(
        `Rendering table for location ${locationId} with records:`,
        records[locationId]
    );

    // Remove duplicates from the records array
    const uniqueRecords = [];
    const seen = new Set();

    records[locationId].forEach((rec) => {
        const recordKey = `${rec.day}-${rec.shiftType}-${rec.from}-${rec.to}`;
        if (!seen.has(recordKey)) {
            seen.add(recordKey);
            uniqueRecords.push(rec);
        }
    });

    // Update the records array with unique records
    records[locationId] = uniqueRecords;
    const tbody = document.querySelector(`#shiftTable_${locationId} tbody`);
    tbody.innerHTML = "";

    const filteredRecords = getFilteredRecords(locationId);
    console.log(
        `Filtered records for location ${locationId}:`,
        filteredRecords
    );
    // Group records by shift type
    const groupedRecords = filteredRecords.reduce((acc, rec) => {
        const key = `${rec.shiftType}-${rec.from}-${rec.to}-${rec.employees}`;
        if (!acc[key]) {
            acc[key] = { ...rec, days: [rec.day] }; // Initialize with the first day
        } else {
            acc[key].days.push(rec.day); // Add the day to the existing group
        }
        return acc;
    }, {});

    Object.values(groupedRecords).forEach((rec, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="border px-2 py-1">${rec.days.join(", ")}</td>
            <td class="border px-2 py-1">${rec.shiftType}</td>
            <td class="border px-2 py-1">${rec.from}</td>
            <td class="border px-2 py-1">${rec.to}</td>
            <td class="border px-2 py-1">${rec.employees}</td>
            <td class="border px-2 py-1 text-center flex justify-center items-center gap-3">
             <!-- Add Button -->
                <button type="button" class="text-green-600 add-row-btn" title="Add Row">
                    <i class="fas fa-plus"></i>
                </button>

                <!-- Update Button -->
                <button type="button" class="text-blue-600 update-row-btn" title="Update Row">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="text-red-600 remove-record-btn" data-key="${
                    rec.shiftType
                }-${rec.from}-${rec.to}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Add event listeners for Add, Update, and Delete buttons
    tbody.querySelectorAll(".add-row-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const clickedRow = this.closest("tr");
            addRow(locationId, clickedRow);
        });
    });

    tbody.querySelectorAll(".update-row-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const clickedRow = this.closest("tr");
            updateRow(locationId, clickedRow);
        });
    });

    // Add event listeners for delete buttons
    tbody.querySelectorAll(".remove-record-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const key = btn.dataset.key;
            const [shiftType, from, to] = key.split("-");
            records[locationId] = records[locationId].filter(
                (rec) =>
                    !(
                        rec.shiftType === shiftType &&
                        rec.from === from &&
                        rec.to === to
                    )
            );
            renderTable(locationId); // Re-render the table
        });
    });
}
function addRow(locationId, clickedRow) {
    // Get the values from the clicked row
    const from = clickedRow.querySelector("td:nth-child(3)").textContent.trim();
    const to = clickedRow.querySelector("td:nth-child(4)").textContent.trim();
    const employees = clickedRow
        .querySelector("td:nth-child(5)")
        .textContent.trim();

    // Validate that the required fields are filled
    if (!from || !to || !employees || parseInt(employees, 10) <= 0) {
        showToast(
            "Please fill in the 'From', 'To', and '# Employees' fields by updating the row first.",
            "error"
        );
        return; // Stop execution if validation fails
    }

    const distinctDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Get the shift type from the clicked row
    const shiftType = clickedRow
        .querySelector("td:nth-child(2)")
        .textContent.trim();

    // Add a record for each day to the records array
    distinctDays.forEach((day) => {
        records[locationId].push({
            day: day, // Add each day as a separate record
            shiftType: shiftType, // Same shift type as the clicked row
            from: "", // Empty from time
            to: "", // Empty to time
            employees: 0, // Default employees to 0
        });
    });

    // Re-render the table to include the new row
    renderTable(locationId);
}
function updateRow(locationId, clickedRow) {
    const modal = document.getElementById(`batchFormModal_${locationId}`);

    // Get values from the clicked row
    const day = clickedRow.querySelector("td:nth-child(1)").textContent.trim();
    const shiftType = clickedRow
        .querySelector("td:nth-child(2)")
        .textContent.trim();
    const fromTime = clickedRow
        .querySelector("td:nth-child(3)")
        .textContent.trim();
    const toTime = clickedRow
        .querySelector("td:nth-child(4)")
        .textContent.trim();
    const employees = clickedRow
        .querySelector("td:nth-child(5)")
        .textContent.trim();
    console.log(`Updating row for location ${locationId}:`, {
        day,
        shiftType,
        fromTime,
        toTime,
        employees,
    });

    // Pre-fill the modal fields
    const daysField = document.getElementById(`batchDays_${locationId}`);
    const shiftTypeField = document.getElementById(
        `batchShiftType_${locationId}`
    );
    const fromField = document.getElementById(`batchFrom_${locationId}`);
    const toField = document.getElementById(`batchTo_${locationId}`);
    const employeesField = document.getElementById(
        `batchEmployees_${locationId}`
    );
    console.log("Modal fields:", {
        daysField,
        shiftTypeField,
        fromField,
        toField,
        employeesField,
    });

    if (
        !daysField ||
        !shiftTypeField ||
        !fromField ||
        !toField ||
        !employeesField
    ) {
        console.error("One or more modal fields are missing.");
        return;
    }
    // Split the day string into an array of individual days
    const dayArray = day.split(",").map((d) => d.trim());

    // Update the custom dropdown for batch days
    const options = Array.from(daysField.options);
    options.forEach((option) => {
        option.selected = dayArray.includes(option.value);
    });

    // Update the custom dropdown checkboxes
    const dropdownWrapper = daysField.parentElement.querySelector(".relative");
    if (dropdownWrapper) {
        const checkboxes = dropdownWrapper.querySelectorAll(
            ".batch-day-checkbox"
        );
        checkboxes.forEach((checkbox) => {
            checkbox.checked = dayArray.includes(checkbox.value);
        });

        // Update the dropdown button text
        const selectedOptions = options
            .filter((opt) => opt.selected)
            .map((opt) => opt.textContent);
        const dropdownButton = dropdownWrapper.querySelector("button span");
        if (dropdownButton) {
            dropdownButton.textContent =
                selectedOptions.length > 0
                    ? selectedOptions.join(", ")
                    : "Select Days";
        }
    }
    // Set the shift type in the dropdown
    Array.from(shiftTypeField.options).forEach((option) => {
        if (option.textContent.trim() === shiftType) {
            option.selected = true;
        }
    });
    // make the select tag of shift tyoe disabled
    shiftTypeField.disabled = true;
    fromField.value = fromTime; // Set the from time value
    toField.value = toTime; // Set the to time value
    employeesField.value = employees; // Set the employees value

    // Show the modal
    modal.classList.remove("hidden");

    previousFormData = {
        dayArray,
        shiftType,
        fromTime,
        toTime,
        employees,
    };
}
function attachRowEventListeners(locationId) {
    const tableBody = document.querySelector(`#shiftTable_${locationId} tbody`);

    // Add Row Button
    tableBody.querySelectorAll(".add-row-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const clickedRow = this.closest("tr");
            addRow(locationId, clickedRow);
        });
    });

    // Update Row Button
    tableBody.querySelectorAll(".update-row-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const clickedRow = this.closest("tr");
            updateRow(locationId, clickedRow);
        });
    });

    // Delete Row Button
    tableBody.querySelectorAll(".remove-record-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const clickedRow = this.closest("tr");
            clickedRow.remove();
        });
    });
}

function initializeCustomDropdownForBatchDays(locationId, selectElement) {
    const options = Array.from(selectElement.options);

    // Create a custom dropdown
    const dropdownWrapper = document.createElement("div");
    dropdownWrapper.className = "relative";

    const dropdownButton = document.createElement("button");
    dropdownButton.type = "button";
    dropdownButton.className =
        "bg-gray-200 px-4 py-2 rounded w-full text-left flex justify-between items-center";
    dropdownButton.innerHTML = `<span>Select Days</span><i class="fas fa-chevron-down"></i>`;

    const dropdownMenu = document.createElement("div");
    dropdownMenu.className =
        "absolute bg-white border rounded shadow hidden w-full z-10 flex flex-wrap gap-4 p-2";

    // Populate the dropdown menu with checkboxes
    options.forEach((option) => {
        const label = document.createElement("label");
        label.className =
            "flex items-center gap-2 bg-gray-100 px-3 py-2 rounded hover:bg-gray-200 cursor-pointer shadow-sm";
        label.style.minWidth = "120px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = option.value;
        checkbox.className = "mr-2 batch-day-checkbox";
        checkbox.checked = option.selected;

        checkbox.addEventListener("change", () => {
            option.selected = checkbox.checked;

            // Update the button text
            const selectedOptions = options
                .filter((opt) => opt.selected)
                .map((opt) => opt.textContent);
            dropdownButton.querySelector("span").textContent =
                selectedOptions.length > 0
                    ? selectedOptions.join(", ")
                    : "Select Days";

            // Trigger the change event on the select element
            const event = new Event("change");
            selectElement.dispatchEvent(event);
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(option.textContent));
        dropdownMenu.appendChild(label);
    });

    // Toggle dropdown visibility
    dropdownButton.addEventListener("click", () => {
        dropdownMenu.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (
            !dropdownWrapper.contains(e.target) &&
            !dropdownMenu.classList.contains("hidden")
        ) {
            dropdownMenu.classList.add("hidden");
        }
    });

    // Replace the select element with the custom dropdown
    selectElement.style.display = "none";
    dropdownWrapper.appendChild(dropdownButton);
    dropdownWrapper.appendChild(dropdownMenu);
    selectElement.parentNode.insertBefore(
        dropdownWrapper,
        selectElement.nextSibling
    );
}

function populateBatchDays(locationId) {
    const daysSelect = document.getElementById(`batchDays_${locationId}`);
    const weekdaysBtn = document.getElementById(`weekdaysBtn_${locationId}`);
    const weekendsBtn = document.getElementById(`weekendsBtn_${locationId}`);
    const allDaysBtn = document.getElementById(`allDaysBtn_${locationId}`);

    if (daysSelect) {
        // Clear existing options
        daysSelect.innerHTML = "";

        // Add options for days
        const daysOptions = [
            { value: "Mon", label: "Monday" },
            { value: "Tue", label: "Tuesday" },
            { value: "Wed", label: "Wednesday" },
            { value: "Thu", label: "Thursday" },
            { value: "Fri", label: "Friday" },
            { value: "Sat", label: "Saturday" },
            { value: "Sun", label: "Sunday" },
        ];

        daysOptions.forEach((day) => {
            const opt = document.createElement("option");
            opt.value = day.value;
            opt.textContent = day.label;
            daysSelect.appendChild(opt);
        });

        // Initialize the custom dropdown for batch days
        initializeCustomDropdownForBatchDays(locationId, daysSelect);

        // Add event listeners for the buttons
        if (weekdaysBtn) {
            weekdaysBtn.addEventListener("click", () => {
                selectDays(daysSelect, ["Mon", "Tue", "Wed", "Thu", "Fri"]);
            });
        }

        if (weekendsBtn) {
            weekendsBtn.addEventListener("click", () => {
                selectDays(daysSelect, ["Sat", "Sun"]);
            });
        }

        if (allDaysBtn) {
            allDaysBtn.addEventListener("click", () => {
                selectDays(daysSelect, [
                    "Mon",
                    "Tue",
                    "Wed",
                    "Thu",
                    "Fri",
                    "Sat",
                    "Sun",
                ]);
            });
        }
    }
}
function selectDays(selectElement, days) {
    const options = Array.from(selectElement.options);

    // Clear all selections
    options.forEach((option) => {
        option.selected = false;
    });

    // Select the specified days
    options.forEach((option) => {
        if (days.includes(option.value)) {
            option.selected = true;
        }
    });

    // Update the custom dropdown checkboxes
    const dropdownWrapper =
        selectElement.parentElement.querySelector(".relative");
    if (dropdownWrapper) {
        const checkboxes = dropdownWrapper.querySelectorAll(
            ".batch-day-checkbox"
        );
        checkboxes.forEach((checkbox) => {
            checkbox.checked = days.includes(checkbox.value);
        });

        // Update the dropdown button text
        const selectedOptions = options
            .filter((opt) => opt.selected)
            .map((opt) => opt.textContent);
        const dropdownButton = dropdownWrapper.querySelector("button span");
        if (dropdownButton) {
            dropdownButton.textContent =
                selectedOptions.length > 0
                    ? selectedOptions.join(", ")
                    : "Select Days";
        }
    }

    // Trigger the change event on the select element
    const event = new Event("change");
    selectElement.dispatchEvent(event);
}

locations.forEach((location) => {
    populateBatchDays(location.id);
});

function showBatchForm(locationId) {
    const batchForm = document.getElementById(`batchForm_${locationId}`);
    batchForm.classList.remove("hidden");
}

function populateBatchShiftTypes(locationId) {
    const shiftTypesSelect = document.getElementById(
        `shiftTypes_${locationId}`
    );
    const batchShiftTypeSelect = document.getElementById(
        `batchShiftType_${locationId}`
    );
    const filterShiftTypeSelect = document.getElementById(
        `filterShiftType_${locationId}`
    );

    // Debugging: Log the elements
    console.log("shiftTypesSelect:", shiftTypesSelect);
    console.log("batchShiftTypeSelect:", batchShiftTypeSelect);
    console.log("filterShiftTypeSelect:", filterShiftTypeSelect);
    batchShiftTypeSelect.innerHTML = ""; // Clear existing options
    filterShiftTypeSelect.innerHTML = `<option value="">All</option>`; // Clear and add "All" option

    Array.from(shiftTypesSelect.selectedOptions).forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.textContent;
        batchShiftTypeSelect.appendChild(opt);

        // Add to filter dropdown
        const filterOpt = document.createElement("option");
        filterOpt.value = option.value;
        filterOpt.textContent = option.textContent;
        filterShiftTypeSelect.appendChild(filterOpt);
    });
}
function getShiftTypeTextById(locationId, shiftTypeId) {
    const shiftTypesSelect = document.getElementById(
        `shiftTypes_${locationId}`
    );
    if (!shiftTypesSelect) {
        console.error(
            `Shift types select element not found for location: ${locationId}`
        );
        return null;
    }

    // Find the option with the matching value (ID)
    const option = Array.from(shiftTypesSelect.options).find(
        (opt) => opt.value === shiftTypeId
    );

    // Return the text content if found, otherwise return null
    return option ? option.textContent : null;
}

function addShift(locationId) {
    const shiftTypeID = document.getElementById(
        `batchShiftType_${locationId}`
    ).value;
    const shiftType = getShiftTypeTextById(locationId, shiftTypeID);
    const from = document.getElementById(`batchFrom_${locationId}`).value;
    const to = document.getElementById(`batchTo_${locationId}`).value;
    const employees =
        parseInt(
            document.getElementById(`batchEmployees_${locationId}`).value,
            10
        ) || 1;
    const selectedDays = Array.from(
        document.getElementById(`batchDays_${locationId}`).selectedOptions
    ).map((opt) => opt.value);

    // Validation
    if (!shiftType || !from || !to || selectedDays.length === 0) {
        showToast(
            "Please select shift type, times, and at least one day.",
            "error"
        );
        return;
    }

    if (employees < 1) {
        showToast("Number of employees must be at least 1.", "error");
        return;
    }
    console.log("Adding shift:", {
        locationId,
        shiftType,
        from,
        to,
        employees,
        selectedDays,
    });

    let hasDuplicate = false;

    selectedDays.forEach((dayName) => {
        console.log(
            "Processing day:",
            dayName,
            "the records for location:",
            records[locationId]
        );
        console.log(
            "selected shift type:",
            shiftType,
            "from:",
            from,
            "to:",
            to
        );
        const existingRecords = records[locationId].filter(
            (rec) => rec.day === dayName && rec.shiftType === shiftType
        );
        console.log("Existing records for day:", dayName, existingRecords);

        // Check for duplicates
        const duplicate = existingRecords.find(
            (rec) => rec.from === from && rec.to === to
        );
        if (duplicate) {
            hasDuplicate = true;
            // Show error and skip adding this shift
            showToast("A shift with the same time already exists.", "error");
            return;
        }

        // Update empty record if exists
        const emptyRecord = existingRecords.find((rec) => !rec.from || !rec.to);
        console.log("Empty record found:", emptyRecord);
        if (emptyRecord) {
            console.log("Updating empty record:", emptyRecord);
            emptyRecord.from = from;
            emptyRecord.to = to;
            emptyRecord.employees = employees;
        } else {
            // Add new record
            records[locationId].push({
                day: dayName,
                shiftType,
                from,
                to,
                employees,
            });
        }
    });

    if (hasDuplicate) {
        showToast("A shift with the same time already exists.", "error");
        return;
    }

    showToast("Shift added successfully!", "success");
    renderTable(locationId);
}

function openAddShiftTypeModal(locationId) {
    const modal = document.getElementById("addShiftTypeModal");
    modal.classList.remove("hidden");
    modal.dataset.locationId = locationId; // Store the location ID for later use

    // Dynamically populate day types in the modal
    const dayTypesContainer = document.getElementById("dayTypesContainer");
    dayTypesContainer.innerHTML = ""; // Clear previous content

    const dayTypes = ["day", "night", "saturday", "sunday", "public holiday"];
    dayTypes.forEach((dayType) => {
        const div = document.createElement("div");
        div.classList.add("mb-4");

        div.innerHTML = `
            <label for="${dayType}Rate" class="block text-sm font-medium mb-1">${
            dayType.charAt(0).toUpperCase() + dayType.slice(1)
        } Rate</label>
            <input type="number" id="${dayType}Rate" name="${dayType}_rate" class="form-input w-full border border-gray-300 rounded px-3 py-2">
        `;
        dayTypesContainer.appendChild(div);
    });
}

function closeAddShiftTypeModal() {
    const modal = document.getElementById("addShiftTypeModal");
    modal.classList.add("hidden");
}

// function addSelectionToOptions() {
//     const shiftTypes = shiftTypesChoices
//         .getValue(true)
//         .map((item) => item.label);
//     const locations = locationChoices.getValue(true).map((item) => item.label);
//     const dateRange = document.getElementById("dateRange").value;

//     try {
//         selectionManager.addSelection(shiftTypes, locations, dateRange);
//         showToast("Selection added successfully!", "success");
//         setSummary(); // Update the summary
//     } catch (error) {
//         showToast(error.message, "error");
//     }
// }

// function removeSelection(index) {
//     try {
//         selectionManager.removeSelection(index);
//         showToast("Selection removed successfully!", "success");
//         setSummary(); // Update the summary
//     } catch (error) {
//         showToast(error.message, "error");
//     }
// }

// function setSummary() {
//     const summary = document.getElementById("summarySection");

//     // Clear the summary content
//     summary.innerHTML = "";
//     // Get the selected options from the SelectionManager
//     const selectedOptions = selectionManager.getSelections();

//     // Iterate over selectedOptions and display each selection
//     selectedOptions.forEach((option, index) => {
//         summary.innerHTML += `
//             <div class="summary-content bg-gray-100 p-4 rounded-lg shadow-md mb-4">
//                 <p class="text-sm font-medium text-gray-700 mb-2">
//                     <strong>Selection ${index + 1}:</strong>
//                 </p>
//                 <p class="text-sm font-medium text-gray-700 mb-2">
//                     <strong>Shift Types:</strong> ${
//                         option.shiftTypes.join(", ") || "None selected"
//                     }
//                 </p>
//                 <p class="text-sm font-medium text-gray-700 mb-2">
//                     <strong>Location:</strong> ${
//                         option.locations.join(", ") || "Not selected"
//                     }
//                 </p>
//                 <p class="text-sm font-medium text-gray-700">
//                     <strong>Date Range:</strong> ${
//                         option.dateRange || "Not selected"
//                     }
//                 </p>
//                                 <button
//                     class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 focus:ring-2 focus:ring-red-400 mt-2"
//                     onclick="removeSelection(${index})">
//                     Remove
//                 </button>
//             </div>
//         `;
//     });
// }
function initializeCustomDropdown(locationId, selectElement) {
    const options = Array.from(selectElement.options);

    // Create a custom dropdown
    const dropdownWrapper = document.createElement("div");
    dropdownWrapper.className = "relative";

    const dropdownButton = document.createElement("button");
    dropdownButton.type = "button";
    dropdownButton.className =
        "bg-white text-gray-700 px-4 py-2 rounded w-full text-left flex justify-between items-center border border-gray-300 shadow-sm hover:bg-gray-100";
    dropdownButton.innerHTML = `<span>Select Shift Types</span><i class="fas fa-chevron-down"></i>`;

    const dropdownMenu = document.createElement("div");
    dropdownMenu.className =
        "absolute bg-white border rounded shadow-lg hidden w-full z-10 flex flex-wrap gap-4 p-2";

    // Populate the dropdown menu with checkboxes
    options.forEach((option) => {
        const label = document.createElement("label");
        label.className =
            "flex items-center gap-2 bg-gray-100 px-3 py-2 rounded hover:bg-gray-200 cursor-pointer shadow-sm";
        label.style.minWidth = "120px"; // Set a minimum width for each option

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = option.value;
        checkbox.className = "mr-2 shift-type-checkbox";
        checkbox.checked = option.selected;

        checkbox.addEventListener("change", () => {
            option.selected = checkbox.checked;

            // Update the button text
            const selectedOptions = options
                .filter((opt) => opt.selected)
                .map((opt) => opt.textContent);
            dropdownButton.querySelector("span").textContent =
                selectedOptions.length > 0
                    ? selectedOptions.join(", ")
                    : "Select Shift Types";
            // Trigger the change event on the select element
            const event = new Event("change");
            selectElement.dispatchEvent(event);
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(option.textContent));
        dropdownMenu.appendChild(label);
    });

    // Toggle dropdown visibility
    dropdownButton.addEventListener("click", () => {
        dropdownMenu.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (
            !dropdownWrapper.contains(e.target) &&
            !dropdownMenu.classList.contains("hidden")
        ) {
            dropdownMenu.classList.add("hidden");
        }
    });

    // Replace the select element with the custom dropdown
    selectElement.style.display = "none";
    dropdownWrapper.appendChild(dropdownButton);
    dropdownWrapper.appendChild(dropdownMenu);
    selectElement.parentNode.insertBefore(
        dropdownWrapper,
        selectElement.nextSibling
    );
    // Add event listener to the select element to handle changes
    selectElement.addEventListener("change", () => {
        console.log(`Shift types updated for location ${locationId}`);
        initializeShiftTable(locationId); // Update the Shift Details section

        // Update the <p> tag beside the address
        const addressElement = document
            .querySelector(`#form_${locationId}`)
            .parentElement.querySelector("p");

        if (addressElement) {
            const selectedShiftTypes = Array.from(
                selectElement.selectedOptions
            ).map((option) => option.textContent);

            // Extract the existing date range from the <p> tag
            const currentText = addressElement.textContent;
            const dateRangeMatch = currentText.match(/Date Range: (.+)$/);
            const existingDateRange = dateRangeMatch
                ? dateRangeMatch[1]
                : "Not Set";

            // Update the <p> tag with the new shift types and preserve the date range
            addressElement.textContent = `${
                locations.find((loc) => loc.id === locationId).address
            } | Shift Types: ${selectedShiftTypes.join(
                ", "
            )} | Date Range: ${existingDateRange}`;
            // Update localStorage with the new shift types
            const savedData = localStorage.getItem(`location_${locationId}`);
            const locationData = savedData
                ? JSON.parse(savedData)
                : { shiftTypes: [], dateRange: existingDateRange };

            locationData.shiftTypes = selectedShiftTypes; // Update shift types
            localStorage.setItem(
                `location_${locationId}`,
                JSON.stringify(locationData)
            );
        }
    });
}

async function loadStep2Options() {
    try {
        // Fetch shift types and locations from the API
        const [shiftTypes, locations] = await Promise.all([
            apiService.getShiftTypes(),
            apiService.getLocations(),
        ]);

        // Iterate over each location to populate shift types
        locations.forEach((location) => {
            const shiftTypesSelect = document.getElementById(
                `shiftTypes_${location.id}`
            );
            const dateRangeInput = document.getElementById(
                `dateRange_${location.id}`
            );
            // Add event listener for date range changes
            dateRangeInput.addEventListener("change", () => {
                console.log(`Date range updated for location ${location.id}`);

                // Update the <p> tag beside the address
                const addressElement = document
                    .querySelector(`#form_${location.id}`)
                    .parentElement.querySelector("p");

                if (addressElement) {
                    const selectedShiftTypes = Array.from(
                        shiftTypesSelect.selectedOptions
                    ).map((option) => option.textContent);

                    // Update the <p> tag with the new date range and preserve the shift types
                    addressElement.textContent = `${
                        locations.find((loc) => loc.id === location.id).address
                    } | Shift Types: ${selectedShiftTypes.join(
                        ", "
                    )} | Date Range: ${dateRangeInput.value}`;

                    // Update localStorage with the new date range
                    const savedData = localStorage.getItem(
                        `location_${location.id}`
                    );
                    const locationData = savedData
                        ? JSON.parse(savedData)
                        : { shiftTypes: selectedShiftTypes, dateRange: "" };

                    locationData.dateRange = dateRangeInput.value; // Update the date range
                    localStorage.setItem(
                        `location_${location.id}`,
                        JSON.stringify(locationData)
                    );
                }
            });

            // Clear existing options
            shiftTypesSelect.innerHTML = "";

            // Populate the select element with shift types
            shiftTypes.forEach((st) => {
                const opt = document.createElement("option");
                opt.value = st.id; // Use the shift type ID as the value
                opt.textContent = st.name; // Use the shift type name as the label
                shiftTypesSelect.appendChild(opt);
            });

            // Handle pre-selected options (if saved in localStorage)
            const savedData = localStorage.getItem(`location_${location.id}`);
            if (savedData) {
                const { shiftTypes: savedShiftTypes } = JSON.parse(savedData);

                // Pre-select saved shift types
                if (
                    Array.isArray(savedShiftTypes) &&
                    savedShiftTypes.length > 0
                ) {
                    Array.from(shiftTypesSelect.options).forEach((option) => {
                        if (savedShiftTypes.includes(option.textContent)) {
                            option.selected = true;
                        }
                    });
                }
            }

            // Initialize custom dropdown behavior (if needed)
            initializeCustomDropdown(location.id, shiftTypesSelect);
            // Initialize Flatpickr for the date range input
            flatpickr(dateRangeInput, {
                mode: "range",
                dateFormat: "Y-m-d",
                allowInput: true,
                onClose: function (selectedDates, dateStr, instance) {
                    // Ensure at least two dates are selected
                    if (selectedDates.length === 2) {
                        const startDate = selectedDates[0];
                        const endDate = selectedDates[1];

                        // Calculate the difference in days
                        const diffInDays = Math.ceil(
                            (endDate - startDate) / (1000 * 60 * 60 * 24)
                        );

                        // Check if the range is less than 7 days
                        if (diffInDays < 7) {
                            showToast(
                                "The selected date range must be at least 7 days.",
                                "error"
                            );

                            // Clear the input field or reset the selection
                            instance.clear();
                        }
                    }
                },
                onChange: function (selectedDates, dateStr, instance) {
                    console.log("Selected Date Range:", dateStr);
                },
            });
        });
    } catch (error) {
        showToast(
            extractAxiosErrorMsg(error, "Failed to load options."),
            "error"
        );
    }
}

function getSelectedLocations() {
    const locationsArray = []; // Array to store location objects

    // Iterate over all locations
    locations.forEach((location) => {
        const shiftTypesSelect = document.getElementById(
            `shiftTypes_${location.id}`
        );
        const dateRangeInput = document.getElementById(
            `dateRange_${location.id}`
        );

        // Get selected shift types
        const selectedShiftTypes = Array.from(
            shiftTypesSelect.selectedOptions
        ).map((option) => option.textContent);

        // Get selected date range
        const selectedDateRange = dateRangeInput.value;

        // Add the location object to the array
        locationsArray.push({
            locationId: location.id,
            shiftTypes: selectedShiftTypes,
            dateRange: selectedDateRange,
        });
    });

    return locationsArray;
}

// Function to handle adding a shift type
async function addShiftType() {
    const modal = document.getElementById("addShiftTypeModal");
    const name = document.getElementById("shiftTypeName").value.trim();
    const description = document
        .getElementById("shiftTypeDescription")
        .value.trim();
    const dayRate = document.getElementById("dayRate").value.trim();
    const nightRate = document.getElementById("nightRate").value.trim();
    const saturdayRate = document.getElementById("saturdayRate").value.trim();
    const sundayRate = document.getElementById("sundayRate").value.trim();
    const publicHolidayRate = document
        .getElementById("publicHolidayRate")
        .value.trim();

    // Validate inputs
    if (
        !name ||
        !dayRate ||
        !nightRate ||
        !saturdayRate ||
        !sundayRate ||
        !publicHolidayRate
    ) {
        showToast("Please fill out all required fields.", "error");
        return;
    }

    try {
        // Step 1: Create the shift type
        const shiftTypeResponse = await apiService.createShiftType({
            name,
            description,
        });

        const shiftTypeId = shiftTypeResponse.data.id;

        // Step 2: Create rates for each day type
        const rates = [
            { day_type: "day", rate: dayRate },
            { day_type: "night", rate: nightRate },
            { day_type: "saturday", rate: saturdayRate },
            { day_type: "sunday", rate: sundayRate },
            { day_type: "public holiday", rate: publicHolidayRate },
        ];

        for (const rate of rates) {
            console.log(
                `Adding rate for ${rate.day_type}: ${rate.rate} ${rate}`
            );
            const dayTypeId = await getDayTypeId(rate.day_type); // Fetch day_type_id dynamically
            await apiService.createRate({
                shift_type_id: shiftTypeId,
                day_type_id: dayTypeId,
                rate: rate.rate,
            });
        }

        showToast("Shift Type and rates added successfully!", "success");
        closeAddShiftTypeModal();

        // Add the new shift type to all dropdowns dynamically
        Object.keys(window.choicesInstances).forEach((locationId) => {
            const shiftTypesSelect = document.getElementById(
                `shiftTypes_${locationId}`
            );
            const opt = document.createElement("option");
            opt.value = shiftTypeId;
            opt.textContent = name;
            shiftTypesSelect.appendChild(opt);

            // Update the Choices.js instance
            const choicesInstance = window.choicesInstances[locationId];
            if (choicesInstance) {
                choicesInstance.setChoices(
                    [
                        ...Array.from(shiftTypesSelect.options).map(
                            (option) => ({
                                value: option.value,
                                label: option.textContent,
                                selected: option.selected,
                                disabled: option.disabled,
                            })
                        ),
                    ],
                    "value",
                    "label",
                    false
                );
            }
        });
    } catch (error) {
        const errorMessage = extractAxiosErrorMsg(
            error,
            "Failed to add Shift Type and rates."
        );
        showToast(errorMessage, "error");
    }
}
// Helper function to fetch day_type_id dynamically
async function getDayTypeId(dayTypeName) {
    const dayTypes = await apiService.getDayTypes();
    const dayType = dayTypes.find(
        (dt) => dt.name.toLowerCase() === dayTypeName.toLowerCase()
    );
    return dayType ? dayType.id : null;
}

function validateStep2Form() {
    let isValid = true;

    // Iterate over all locations to validate their inputs
    locations.forEach((location) => {
        const shiftTypesSelect = document.getElementById(
            `shiftTypes_${location.id}`
        );
        const dateRangeInput = document.getElementById(
            `dateRange_${location.id}`
        );

        // Check if at least one shift type is selected
        if (!shiftTypesSelect.selectedOptions.length) {
            showToast(
                `Please select at least one shift type for location: ${location.name}`,
                "error"
            );
            isValid = false;
        }

        // Check if a valid date range is selected
        if (!dateRangeInput.value) {
            showToast(
                `Please select a valid date range for location: ${location.name}`,
                "error"
            );
            isValid = false;
        }
    });

    return isValid;
}

function initializeShiftTable(locationId) {
    const shiftTypesSelect = document.getElementById(
        `shiftTypes_${locationId}`
    );

    const selectedShiftTypes = Array.from(shiftTypesSelect.selectedOptions).map(
        (opt) => opt.textContent
    );
    console.log("Selected Shift Types:", selectedShiftTypes);

    const distinctDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    console.log("records before", records);

    // Get the existing records for the location
    const existingRecords = records[locationId] || [];

    // Filter out records for shift types that are no longer selected
    const updatedRecords = existingRecords.filter((rec) =>
        selectedShiftTypes.includes(rec.shiftType)
    );

    // Check which shift types already have at least one non-empty record
    const shiftTypesWithRecords = new Set();
    updatedRecords.forEach((rec) => {
        if (rec.from !== "" || rec.to !== "" || rec.employees !== 0) {
            shiftTypesWithRecords.add(rec.shiftType);
        }
    });

    console.log(
        "Shift types with existing records:",
        Array.from(shiftTypesWithRecords)
    );

    // Only add empty records for shift types that don't have any records yet
    distinctDays.forEach((day) => {
        selectedShiftTypes.forEach((shiftType) => {
            // Only add empty records if this shift type has no records at all
            const shiftTypeExists = updatedRecords.some(
                (rec) => rec.shiftType === shiftType
            );

            const exists = updatedRecords.some(
                (rec) => rec.day === day && rec.shiftType === shiftType
            );

            if (!exists && !shiftTypesWithRecords.has(shiftType)) {
                updatedRecords.push({
                    day,
                    shiftType,
                    from: "",
                    to: "",
                    employees: 0,
                });
            }
        });
    });

    // Update the records array for the location
    records[locationId] = updatedRecords;
    console.log("records after", records);

    renderTable(locationId);
}
function updateShift(locationId) {
    const shiftTypeID = document.getElementById(
        `batchShiftType_${locationId}`
    ).value;
    const shiftType = getShiftTypeTextById(locationId, shiftTypeID);
    const from = document.getElementById(`batchFrom_${locationId}`).value;
    const to = document.getElementById(`batchTo_${locationId}`).value;
    const employees =
        parseInt(
            document.getElementById(`batchEmployees_${locationId}`).value,
            10
        ) || 1;
    const selectedDays = Array.from(
        document.getElementById(`batchDays_${locationId}`).selectedOptions
    ).map((opt) => opt.value);

    // Validation
    if (!shiftType || !from || !to || selectedDays.length === 0) {
        showToast(
            "Please select shift type, times, and at least one day.",
            "error"
        );
        return;
    }

    if (employees < 1) {
        showToast("Number of employees must be at least 1.", "error");
        return;
    }

    let existingShifts = [];

    // Collect existing shifts for the selected days and shift type
    selectedDays.forEach((dayName) => {
        const matches = records[locationId].filter(
            (rec) => rec.day === dayName && rec.shiftType === shiftType
        );
        existingShifts = existingShifts.concat(matches);
    });

    if (existingShifts.length === 0) {
        // No existing shifts found, add new shifts
        selectedDays.forEach((dayName) => {
            records[locationId].push({
                day: dayName,
                shiftType,
                from,
                to,
                employees,
            });
        });
        showToast("New shifts added successfully!", "success");
        renderTable(locationId);
        return;
    }

    if (existingShifts.length === 1) {
        // Only one shift exists, update it directly
        existingShifts.forEach((rec) => {
            rec.from = from;
            rec.to = to;
            rec.employees = employees;
        });
        showToast("Shift updated successfully!", "success");
        renderTable(locationId);
        return;
    }

    // Multiple shifts exist, show modal for selection
    // Group shifts by `from` and `to` times
    const groupedShifts = existingShifts.reduce((acc, rec) => {
        const key = `${rec.from}-${rec.to}`;
        if (!acc[key]) {
            acc[key] = { ...rec, days: [rec.day] }; // Group by `from` and `to`
        } else {
            acc[key].days.push(rec.day); // Add the day to the existing group
        }
        return acc;
    }, {});

    let tableRows = Object.values(groupedShifts)
        .map(
            (rec, idx) => `
        <tr class="hover:bg-gray-100 ${
            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
        }">
            <td class="px-2 py-1 border"><input type="checkbox" class="update-shift-checkbox" data-key="${
                rec.from
            }-${rec.to}" ></td>
            <td class="px-2 py-1 border">${rec.days.join(", ")}</td>
            <td class="px-2 py-1 border">${rec.shiftType}</td>
            <td class="px-2 py-1 border">${rec.from}</td>
            <td class="px-2 py-1 border">${rec.to}</td>
            <td class="px-2 py-1 border">${rec.employees}</td>
        </tr>
    `
        )
        .join("");

    let modalHtml = `
    <div class="mb-2 font-semibold">Select shifts to update:</div>
    <div style="max-height:260px;overflow:auto;">
    <table class="min-w-full border rounded shadow text-sm">
        <thead>
            <tr class="bg-gray-200 text-gray-700 font-bold">
                <th class="px-2 py-1 border"></th>
                <th class="px-2 py-1 border">Day</th>
                <th class="px-2 py-1 border">Shift Type</th>
                <th class="px-2 py-1 border">From</th>
                <th class="px-2 py-1 border">To</th>
                <th class="px-2 py-1 border"># Employees</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
    </div>
`;

    showModal(
        modalHtml,
        function onConfirm(close, modalElement) {
            const checkboxes = modalElement.querySelectorAll(
                ".update-shift-checkbox"
            );
            checkboxes.forEach((cb) => {
                if (cb.checked) {
                    const key = cb.dataset.key;
                    console.log("Checkbox data-key:", cb.dataset.key);
                    const [fromTime, toTime] = key.split("-");
                    const group = groupedShifts[key];

                    // Update the `from` and `to` times for the selected days
                    group.days.forEach((day) => {
                        if (selectedDays.includes(day)) {
                            records[locationId].forEach((rec) => {
                                if (
                                    rec.day === day &&
                                    rec.shiftType === group.shiftType &&
                                    rec.from === fromTime &&
                                    rec.to === toTime
                                ) {
                                    rec.from = from;
                                    rec.to = to;
                                    rec.employees = employees;
                                }
                            });
                        }
                    });
                }
            });
            renderTable(locationId);
            showToast("Selected shifts updated!", "success");
            close();
        },
        true // Show confirm/cancel buttons
    );
}

function initializeSaveButtons() {
    // Add event listeners to all Save buttons
    locations.forEach((location) => {
        const saveButton = document.getElementById(`saveBtn_${location.id}`);
        const shiftTypesSelect = document.getElementById(
            `shiftTypes_${location.id}`
        );
        const dateRangeInput = document.getElementById(
            `dateRange_${location.id}`
        );
        const addressElement = document
            .querySelector(`#form_${location.id}`)
            .parentElement.querySelector("p");
        console.log("Address Element:", addressElement);

        if (saveButton) {
            saveButton.addEventListener("click", function () {
                let isValid = true;

                // Validate shift types for the specific location
                if (!shiftTypesSelect.selectedOptions.length) {
                    showToast(
                        `Please select at least one shift type for location: ${location.name}`,
                        "error"
                    );
                    isValid = false;
                }

                // Validate date range for the specific location
                if (!dateRangeInput.value) {
                    showToast(
                        `Please select a valid date range for location: ${location.name}`,
                        "error"
                    );
                    isValid = false;
                }

                if (!isValid) {
                    return; // Stop execution if validation fails
                }
                // remove hidden class from the check icon
                const checkIcon = document.getElementById(
                    `checkIcon_${location.id}`
                );
                checkIcon.classList.remove("hidden");

                // Get selected shift types
                const selectedShiftTypes = Array.from(
                    shiftTypesSelect.selectedOptions
                ).map((option) => option.textContent);

                // Get selected date range
                const selectedDateRange = dateRangeInput.value;

                // Save to local storage
                const locationData = {
                    shiftTypes: selectedShiftTypes,
                    dateRange: selectedDateRange,
                };
                localStorage.setItem(
                    `location_${location.id}`,
                    JSON.stringify(locationData)
                );
                // Update the address line with selected shift types and date range
                addressElement.textContent = `${
                    location.address
                } | Shift Types: ${selectedShiftTypes.join(
                    ", "
                )} | Date Range: ${selectedDateRange}`;

                showToast(
                    `Saved information for location: ${location.name}`,
                    "success"
                );
                // Add logs between function calls to identify the error
                console.log("Calling showBatchForm...");
                showBatchForm(location.id);

                console.log("Calling populateBatchShiftTypes...");
                populateBatchShiftTypes(location.id);

                console.log("Calling initializeTimePickers...");
                initializeTimePickers(location.id);

                // console.log("Calling populateBatchDays...");
                // populateBatchDays(location.id);

                console.log("Calling initializeShiftTable...");
                initializeShiftTable(location.id);

                console.log("All functions executed successfully.");
            });
        }
    });
}

function saveBatchForm(locationId, previousFormData) {
    // Get modal field values
    const shiftTypeID = document.getElementById(
        `batchShiftType_${locationId}`
    ).value;
    const shiftType = getShiftTypeTextById(locationId, shiftTypeID);
    const from = document.getElementById(`batchFrom_${locationId}`).value;
    const to = document.getElementById(`batchTo_${locationId}`).value;
    const employees =
        parseInt(
            document.getElementById(`batchEmployees_${locationId}`).value,
            10
        ) || 0;
    const selectedDays = Array.from(
        document.getElementById(`batchDays_${locationId}`).selectedOptions
    ).map((opt) => opt.value);

    console.log("Selected data:", {
        locationId,
        shiftType,
        from,
        to,
        employees,
        selectedDays,
    });

    // Validation
    if (!shiftType || !from || !to || selectedDays.length === 0) {
        showToast("Please fill in all required fields.", "error");
        return;
    }

    if (employees < 1) {
        showToast("Number of employees must be at least 1.", "error");
        return;
    }

    // Check for duplicates before any operations
    const duplicateDays = [];
    selectedDays.forEach((day) => {
        const hasDuplicate = records[locationId].some(
            (rec) =>
                rec.day === day &&
                rec.from === from &&
                rec.to === to &&
                rec.shiftType === shiftType &&
                // Skip the record we're currently editing
                !(
                    previousFormData &&
                    previousFormData.dayArray.includes(day) &&
                    rec.shiftType === previousFormData.shiftType &&
                    rec.from === previousFormData.fromTime &&
                    rec.to === previousFormData.toTime
                )
        );

        if (hasDuplicate) {
            duplicateDays.push(day);
        }
    });

    if (duplicateDays.length > 0) {
        showToast(
            `Duplicate records found for days: ${duplicateDays.join(
                ", "
            )}. Cannot add records with the same day, from, and to times.`,
            "error"
        );
        return;
    }

    // STEP 1: Handle direct updates - if we're editing an existing record
    if (previousFormData && previousFormData.shiftType) {
        // Find the records matching the previous form data
        const recordsToUpdate = records[locationId].filter(
            (rec) =>
                rec.shiftType === previousFormData.shiftType &&
                rec.from === previousFormData.fromTime &&
                rec.to === previousFormData.toTime &&
                rec.employees === parseInt(previousFormData.employees, 10) &&
                previousFormData.dayArray.includes(rec.day)
        );

        // If we found records to update
        if (recordsToUpdate.length > 0) {
            console.log("Records to update:", recordsToUpdate);

            // Check for matching records BEFORE updating anything
            const matchingRecords = records[locationId].filter(
                (rec) =>
                    rec.shiftType === shiftType &&
                    rec.from === from &&
                    rec.to === to &&
                    rec.employees === employees &&
                    !selectedDays.includes(rec.day) &&
                    !recordsToUpdate.includes(rec)
            );

            if (matchingRecords.length > 0) {
                // Show modal asking if user wants to merge
                const daysText = matchingRecords.map((r) => r.day).join(", ");
                const modalHtml = `
                    <div>
                        <p>Found records with the same attributes but different days:</p>
                        <p><strong>Days:</strong> ${daysText}</p>
                        <p>Would you like to merge these records?</p>
                    </div>
                `;

                showModal(
                    modalHtml,
                    function onConfirm(close) {
                        // IF USER CONFIRMS, update and merge

                        // 1. Remove the records to update
                        records[locationId] = records[locationId].filter(
                            (rec) => !recordsToUpdate.includes(rec)
                        );

                        // 2. Remove matching records
                        records[locationId] = records[locationId].filter(
                            (rec) => !matchingRecords.includes(rec)
                        );

                        // 3. Add all merged days
                        const allDays = [
                            ...selectedDays,
                            ...matchingRecords.map((r) => r.day),
                        ];

                        allDays.forEach((day) => {
                            records[locationId].push({
                                day,
                                shiftType,
                                from,
                                to,
                                employees,
                            });
                        });

                        renderTable(locationId);
                        close();
                        showToast("Records merged successfully!", "success");
                        hideBatchFormModal(locationId);

                        localStorage.setItem(
                            `records_${locationId}`,
                            JSON.stringify(records[locationId])
                        );
                    },
                    function onCancel(close) {
                        // CANCEL SHOULD NOT MODIFY ANYTHING
                        if (typeof close === "function") {
                            close();
                        }
                        showToast("Operation cancelled", "info");
                        hideBatchFormModal(locationId);
                    }
                );
            } else {
                // No matching records, proceed with normal update
                records[locationId] = records[locationId].filter(
                    (rec) => !recordsToUpdate.includes(rec)
                );

                // Add new records with the updated values
                selectedDays.forEach((day) => {
                    records[locationId].push({
                        day,
                        shiftType,
                        from,
                        to,
                        employees,
                    });
                });

                showToast("Shift updated successfully!", "success");
                hideBatchFormModal(locationId);
                renderTable(locationId);
                localStorage.setItem(
                    `records_${locationId}`,
                    JSON.stringify(records[locationId])
                );
            }
            return; // Important: stop execution here
        }
    }

    // STEP 2: Handle adding new records (no previous data)

    // Check for matching records BEFORE adding anything
    const matchingRecords = records[locationId].filter(
        (rec) =>
            rec.shiftType === shiftType &&
            rec.from === from &&
            rec.to === to &&
            rec.employees === employees &&
            !selectedDays.includes(rec.day)
    );

    if (matchingRecords.length > 0) {
        // Show modal asking if user wants to merge
        const daysText = matchingRecords.map((r) => r.day).join(", ");
        const modalHtml = `
            <div>
                <p>Found records with the same attributes but different days:</p>
                <p><strong>Days:</strong> ${daysText}</p>
                <p>Would you like to merge these records?</p>
            </div>
        `;

        showModal(
            modalHtml,
            function onConfirm(close) {
                // IF USER CONFIRMS, add and merge

                // 1. Remove matching records
                records[locationId] = records[locationId].filter(
                    (rec) => !matchingRecords.includes(rec)
                );

                // 2. Add all merged days
                const allDays = [
                    ...selectedDays,
                    ...matchingRecords.map((r) => r.day),
                ];

                allDays.forEach((day) => {
                    records[locationId].push({
                        day,
                        shiftType,
                        from,
                        to,
                        employees,
                    });
                });

                renderTable(locationId);
                close();
                showToast("Records merged successfully!", "success");
                hideBatchFormModal(locationId);
                localStorage.setItem(
                    `records_${locationId}`,
                    JSON.stringify(records[locationId])
                );
            },
            function onCancel(close) {
                // CANCEL SHOULD NOT MODIFY ANYTHING
                if (typeof close === "function") {
                    close();
                }
                showToast("Operation cancelled", "info");
                hideBatchFormModal(locationId);
            }
        );
    } else {
        // No matching records, proceed with adding new records
        selectedDays.forEach((day) => {
            records[locationId].push({
                day,
                shiftType,
                from,
                to,
                employees,
            });
        });

        showToast("Shift added successfully!", "success");
        hideBatchFormModal(locationId);
        renderTable(locationId);
        localStorage.setItem(
            `records_${locationId}`,
            JSON.stringify(records[locationId])
        );
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Load step 2 options and then populate saved data
    loadStep2Options().then(() => {
        locations.forEach((location) => {
            const shiftTypesSelect = document.getElementById(
                `shiftTypes_${location.id}`
            );
            const dateRangeInput = document.getElementById(
                `dateRange_${location.id}`
            );
            const addressElement = document
                .querySelector(`#form_${location.id}`)
                .parentElement.querySelector("p");

            // Retrieve saved data for the location from local storage
            const savedData = localStorage.getItem(`location_${location.id}`);

            if (savedData) {
                const { shiftTypes, dateRange } = JSON.parse(savedData);
                console.log("Saved Data for Location:", {
                    shiftTypes,
                    dateRange,
                });

                // Populate shift types
                if (Array.isArray(shiftTypes) && shiftTypes.length > 0) {
                    // Iterate over the options in the select element
                    Array.from(shiftTypesSelect.options).forEach((option) => {
                        // Check if the option's text matches any of the saved shift types
                        if (shiftTypes.includes(option.textContent)) {
                            option.selected = true; // Mark the option as selected
                        }
                    });

                    // Update the dropdown button text to reflect the selected options
                    const selectedOptions = Array.from(
                        shiftTypesSelect.selectedOptions
                    ).map((option) => option.textContent);
                    const dropdownButton =
                        shiftTypesSelect.parentElement.querySelector(
                            "button span"
                        );
                    if (dropdownButton) {
                        dropdownButton.textContent =
                            selectedOptions.length > 0
                                ? selectedOptions.join(", ")
                                : "Select Shift Types";
                    }
                }
                console.log("Shift Types Select Element:", shiftTypesSelect);

                // Populate date range
                if (dateRange) {
                    dateRangeInput.value = dateRange;
                }

                // Update the address line with the saved data
                addressElement.textContent = `${
                    location.address
                } | Shift Types: ${shiftTypes.join(
                    ", "
                )} | Date Range: ${dateRange}`;

                // remove hidden class from the check icon
                const checkIcon = document.getElementById(
                    `checkIcon_${location.id}`
                );
                checkIcon.classList.remove("hidden");

                // Add logs between function calls to identify the error
                console.log("Calling showBatchForm...");
                showBatchForm(location.id);

                console.log("Calling populateBatchShiftTypes...");
                populateBatchShiftTypes(location.id);

                console.log("Calling initializeTimePickers...");
                initializeTimePickers(location.id);

                // console.log("Calling populateBatchDays...");
                // populateBatchDays(location.id);

                console.log("Calling initializeShiftTable...");
                initializeShiftTable(location.id);

                console.log("All functions executed successfully.");
            }
        });

        // Call the function to initialize Save buttons
        initializeSaveButtons();
    });

    // Other initialization logic (e.g., toggle form visibility)
    window.toggleForm = function (locationId) {
        const form = document.getElementById(`form_${locationId}`);
        const arrow = document.getElementById(`arrow_${locationId}`);

        // Update the arrow icon
        if (form.classList.contains("max-h-0")) {
            form.classList.remove("max-h-0");
            form.classList.add("max-h-[500px]");
            arrow.innerHTML = '<i class="fas fa-chevron-down"></i>'; // Down arrow
        } else {
            form.classList.remove("max-h-[500px]");
            form.classList.add("max-h-0");
            arrow.innerHTML = '<i class="fas fa-chevron-up"></i>'; // Up arrow
        }
    };
    // Add to DOMContentLoaded event handler
    locations.forEach((location) => {
        // Load records from localStorage if available
        const savedRecords = localStorage.getItem(`records_${location.id}`);
        if (savedRecords) {
            records[location.id] = JSON.parse(savedRecords);
            renderTable(location.id);
        }
    });

    // window.openAddShiftTypeModal = function (locationId) {
    //     const modal = document.getElementById("addShiftTypeModal");
    //     modal.classList.remove("hidden");
    //     modal.dataset.locationId = locationId; // Store the location ID for later use
    // };

    // Load saved selections from localStorage
    const savedSelections = localStorage.getItem("selectedOptions");
    if (savedSelections) {
        selectedOptions = JSON.parse(savedSelections);
        setSummary(); // Update the summary with the loaded selections
    }

    // loadStep2Options().then(() => {
    //     // Pre-select values from session (window variables set in Blade)
    //     if (window.selectedShiftTypes && shiftTypesChoices) {
    //         shiftTypesChoices.setChoiceByValue(window.selectedShiftTypes);
    //     }
    //     if (window.selectedLocationId && locationChoices) {
    //         locationChoices.setChoiceByValue(window.selectedLocationId);
    //     }
    //     if (window.selectedDateRange) {
    //         document.getElementById("dateRange").value =
    //             window.selectedDateRange;
    //     }
    // });
    // flatpickr("#dateRange", {
    //     mode: "range",
    //     dateFormat: "Y-m-d",
    //     allowInput: true,
    // });

    // // Add event listener for the "Add" button
    // const addSelectionBtn = document.getElementById("addSelectionBtn");
    // if (addSelectionBtn) {
    //     addSelectionBtn.addEventListener("click", function () {
    //         addSelectionToOptions(); // Call the function to add the selection
    //         setSummary(); // Update the summary section
    //     });
    // }

    locations.forEach((location) => {
        const addShiftBtn = document.getElementById(
            `addShiftBtn_${location.id}`
        );
        if (addShiftBtn) {
            addShiftBtn.addEventListener("click", function () {
                addShift(location.id);
            });
        }

        const updateShiftBtn = document.getElementById(
            `updateShiftBtn_${location.id}`
        );
        if (updateShiftBtn) {
            updateShiftBtn.addEventListener("click", function () {
                updateShift(location.id);
            });
        }
    });

    // Add event listeners to all "Add Shift Type" buttons
    const addShiftTypeButtons = document.querySelectorAll(
        ".add-shift-type-btn"
    );
    addShiftTypeButtons.forEach((button) => {
        button.addEventListener("click", function () {
            const locationId = button.getAttribute("data-location-id");
            openAddShiftTypeModal(locationId);
        });
    });

    // Attach event listener to the Cancel button
    const cancelButton = document.querySelector(
        "#addShiftTypeModal .bg-gray-500"
    );
    if (cancelButton) {
        cancelButton.addEventListener("click", function () {
            closeAddShiftTypeModal();
        });
    }

    locations.forEach((location) => {
        const filterDayDropdown = document.getElementById(
            `filterDay_${location.id}`
        );
        const filterShiftTypeDropdown = document.getElementById(
            `filterShiftType_${location.id}`
        );

        if (filterDayDropdown) {
            filterDayDropdown.addEventListener("change", function (e) {
                filterDayValue = e.target.value;
                console.log(
                    `Filter Day Value for Location ${location.id}:`,
                    filterDayValue
                );
                renderTable(location.id); // Pass the location ID to render the correct table
            });
        }

        if (filterShiftTypeDropdown) {
            filterShiftTypeDropdown.addEventListener("change", function (e) {
                console.log("Filter Shift Type Dropdown Changed", e.target);
                const shiftName = getShiftTypeTextById(
                    location.id,
                    e.target.value
                );
                console.log("Shift Name:", shiftName);
                filterShiftTypeValue = shiftName;
                console.log(
                    `Filter Shift Type Value for Location ${location.id}:`,
                    filterShiftTypeValue
                );
                renderTable(location.id); // Pass the location ID to render the correct table
            });
        }
    });
    // Add Event Listeners for Modal Actions
    locations.forEach((location) => {
        const locationId = location.id;

        // Close Button
        const closeBtn = document.getElementById(
            `closeBatchFormModal_${locationId}`
        );
        if (closeBtn) {
            closeBtn.addEventListener("click", () =>
                hideBatchFormModal(locationId)
            );
        }

        // Cancel Button
        const cancelBtn = document.getElementById(
            `cancelBatchFormBtn_${locationId}`
        );
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () =>
                hideBatchFormModal(locationId)
            );
        }

        // Save Button (for now, just hide the modal)
        const saveBtn = document.getElementById(
            `saveBatchFormBtn_${locationId}`
        );
        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                // Pass the previous data to saveBatchForm
                console.log("Previous Form Data:", previousFormData);
                saveBatchForm(location.id, previousFormData);
            });
        }
    });

    // Attach event listener to the Add button
    const addButton = document.querySelector("#addShiftTypeModal .bg-blue-600");
    if (addButton) {
        addButton.addEventListener("click", function () {
            addShiftType();
        });
    }

    const step2Form = document.getElementById("step2Form");
    step2Form.addEventListener("submit", function (e) {
        if (!validateStep2Form()) {
            e.preventDefault();
            return;
        }

        // Get the array of location objects
        const selectedLocations = getSelectedLocations();

        // Update the hidden input field with the selectedLocations array as JSON
        const selectedLocationsInput = document.getElementById(
            "selectedLocationsInput"
        );
        selectedLocationsInput.value = JSON.stringify(selectedLocations);

        showToast("Step 2 validated! Proceeding to next step...", "success");
    });

    // Back button logic
    const backBtn = document.getElementById("backBtn");
    if (backBtn) {
        backBtn.addEventListener("click", function (e) {
            e.preventDefault();
            window.location.href = "/dataentry";
        });
    }
});

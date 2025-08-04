import { apiService } from "./apiService";
import {
    showConfirm,
    showToast,
    validateRequired,
    extractAxiosErrorMsg,
    handleRemoveRow,
    validateRateInput,
} from "./helpers";

// Global loading indicator
let isGlobalLoading = false;

/**
 * Show/hide global loading indicator
 * @param {boolean} show - Whether to show loading
 */
function setGlobalLoading(show) {
    isGlobalLoading = show;
    const loadingIndicator = document.getElementById("globalLoadingIndicator");
    if (loadingIndicator) {
        if (show) {
            loadingIndicator.classList.remove("hidden");
        } else {
            loadingIndicator.classList.add("hidden");
        }
    }
}

/**
 * Enhanced error logging with context
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 */
function logError(error, context) {
    console.error(`[${context}] Error:`, error);
    if (error.response) {
        console.error(`[${context}] Response:`, error.response.data);
        console.error(`[${context}] Status:`, error.response.status);
    }
}

// --- DRY Row Rendering Helpers ---
function createLocationRow(location) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", location.id);
    tr.className = "hover:bg-gray-50 border";
    tr.innerHTML = `
        <td class='px-2 py-1 border-b border'>${location.name}</td>
        <td class='px-2 py-1 border-b border'>${location.address || ""}</td>
        <td class='px-2 py-1 border-b border'>${location.city || ""}</td>
        <td class='px-2 py-1 border-b border'>${location.state || ""}</td>
        <td class='px-2 py-1 border-b border text-center'><button type="button" class=" text-white px-3 py-1  text-xs  remove-location"><i class="fa-solid fa-trash-can text-[#cf4c3f]"></i></button></button></td>
    `;
    return tr;
}

function createShiftTypeRow(shiftType, dayTypes) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", shiftType.id);
    tr.className = "hover:bg-gray-50 border";
    tr.innerHTML = `
        <td class='px-2 py-1 border-b border'><input type="text" name="shift_type_name[]" class="form-input w-full border border-gray-300 rounded px-2 py-1" value="${
            shiftType.name
        }" required></td>
        <td class='px-2 py-1 border-b border'><input type="text" name="shift_type_description[]" class="form-input w-full border border-gray-300 rounded px-2 py-1" value="${
            shiftType.description || ""
        }"></td>
        ${dayTypes
            .map((dt) => {
                const rate = (shiftType.rates || []).find(
                    (r) => r.day_type_id === dt.id
                );
                return `<td class='px-2 py-1 border-b border'><input type="number" step="0.01" name="rate_${
                    shiftType.id
                }_${
                    dt.id
                }" class="form-input w-full border border-gray-300 rounded px-2 py-1" value="${
                    rate ? rate.rate : ""
                }"  ${
                    rate && rate.id ? `data-rate-id="${rate.id}"` : ""
                } required></td>`;
            })
            .join("")}
        <td class='px-2 py-1 border-b border text-center'><button type="button" class="  text-white   text-xs  remove-shift"><i class="fa-solid fa-trash-can text-[#cf4c3f]"></i></button></td>
    `;
    return tr;
}

// --- Data Fetch and Refresh ---
async function fetchAndRenderAll() {
    try {
        setGlobalLoading(true);

        // Fetch day types, shift types (with rates), and locations
        let [dayTypes, shiftTypes, locations] = await Promise.all([
            apiService.getDayTypes(),
            apiService.getShiftTypes(),
            apiService.getLocations(),
        ]);

        console.log("Fetched Data:", { dayTypes, shiftTypes, locations });

        // Render shift types table
        renderShiftTypesTable(shiftTypes, dayTypes);
        // Render locations table
        renderLocationsTable(locations);
    } catch (error) {
        logError(error, "fetchAndRenderAll");
        showToast("Error loading data. Please refresh the page.", "error");
    } finally {
        setGlobalLoading(false);
    }
}

function renderShiftTypesTable(shiftTypes, dayTypes) {
    const tbody = document.querySelector("#shiftRatesTable tbody");
    tbody.innerHTML = "";
    shiftTypes.forEach((shiftType) => {
        tbody.appendChild(createShiftTypeRow(shiftType, dayTypes));
    });
}

function renderLocationsTable(locations) {
    const tbody = document.querySelector("#locationsTable tbody");
    tbody.innerHTML = "";
    locations.forEach((location) => {
        tbody.appendChild(createLocationRow(location));
    });
}

// Add Shift Type Row
const shiftRatesTable = document.querySelector("#shiftRatesTable tbody");
const dayTypes = window.dayTypes;

document.getElementById("addShiftType").addEventListener("click", function () {
    try {
        const tr = document.createElement("tr");
        console.log(`Add Shift Type Clicked ${shiftRatesTable.rows.length}`);
        tr.className = "hover:bg-gray-50 border";
        tr.innerHTML += `<td class="px-4 py-2 border-b border"><input type="text" name="shift_type_name[]" class="form-input w-full border border-gray-300 rounded px-3 py-2" required></td>`;
        tr.innerHTML += `<td class="px-4 py-2 border-b border"><input type="text" name="shift_type_description[]" class="form-input w-full border border-gray-300 rounded px-3 py-2"></td>`;
        dayTypes.forEach((dt) => {
            tr.innerHTML += `<td class="px-4 py-2 border-b border"><input type="number" step="0.01" name="rate_new_${dt.id}" class="form-input w-full border border-gray-300 rounded px-3 py-2" value="0" required></td>`;
        });
        tr.innerHTML += `<td class="px-4 py-2 border-b border text-center"><button type="button" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs border remove-shift">Remove</button></td>`;
        shiftRatesTable.appendChild(tr);

        showToast("New shift type row added", "success");
    } catch (error) {
        logError(error, "addShiftType");
        showToast("Error adding new shift type row", "error");
    }
});

// Save Shift Types & Rates with validation, update, and error display
// Updated to use apiService

document
    .getElementById("saveShiftRates")
    .addEventListener("click", async function () {
        const statusDiv = document.getElementById("shiftRatesStatus");
        const saveBtn = document.getElementById("saveShiftRates");
        const spinner = document.getElementById("saveLoadingSpinner");
        statusDiv.innerHTML = "";

        saveBtn.disabled = true;
        spinner.classList.remove("hidden");

        let rows = shiftRatesTable.querySelectorAll("tr");
        let data = [];
        let hasError = false;
        let shiftNames = [];
        rows.forEach((row, idx) => {
            let nameInput = row.querySelector(
                'input[name="shift_type_name[]"]'
            );
            let descInput = row.querySelector(
                'input[name="shift_type_description[]"]'
            );
            let name = nameInput.value.trim().toLowerCase();
            // Check for duplicate names
            if (shiftNames.includes(name)) {
                showToast(
                    `Duplicate shift type name: "${nameInput.value}"`,
                    "error"
                );
                nameInput.classList.add("border-red-500");
                hasError = true;
            } else {
                shiftNames.push(name);
                nameInput.classList.remove("border-red-500");
            }
            let nameValid = validateRequired(nameInput, "Name is required.");
            if (!nameValid) {
                console.error(`Row ${idx + 1}: Name is required.`);
                hasError = true;
            }
            let shiftTypeId = row.getAttribute("data-id");
            let shiftType = {
                id: shiftTypeId,
                name: nameInput.value.trim(),
                description: descInput.value,
                rates: [],
            };

            const dayTypes = window.dayTypes;
            dayTypes.forEach((dt) => {
                let rateInput = row.querySelector(
                    `input[name="rate_${shiftTypeId || "new"}_${dt.id}"]`
                );
                let rateVal = rateInput ? rateInput.value : "";
                // Use helper for validation
                if (!validateRateInput(rateInput)) {
                    hasError = true;
                }
                shiftType.rates.push({
                    day_type_id: dt.id,
                    rate: rateVal,
                    rateInput: rateInput,
                });
            });

            data.push(shiftType);
        });
        if (hasError) {
            showToast("Please fix validation errors before saving.", "error");
            saveBtn.disabled = false;
            spinner.classList.add("hidden");
            return;
        }
        try {
            // Save or update each shift type and its rates
            for (const shiftType of data) {
                let res;
                if (shiftType.id) {
                    res = await apiService.updateShiftType(shiftType.id, {
                        name: shiftType.name,
                        description: shiftType.description,
                    });
                } else {
                    res = await apiService.createShiftType({
                        name: shiftType.name,
                        description: shiftType.description,
                    });
                    shiftType.id = res.data.id;
                }
                // Save or update rates
                for (const rate of shiftType.rates) {
                    let rateId = rate.rateInput.getAttribute("data-rate-id");
                    if (rateId) {
                        await apiService.updateRate(rateId, {
                            shift_type_id: shiftType.id,
                            day_type_id: rate.day_type_id,
                            rate: rate.rate,
                        });
                    } else {
                        await apiService.createRate({
                            shift_type_id: shiftType.id,
                            day_type_id: rate.day_type_id,
                            rate: rate.rate,
                        });
                    }
                }
            }
            showToast("Shift types and rates saved successfully!", "success");
            fetchAndRenderAll();
        } catch (error) {
            let msg = extractAxiosErrorMsg(
                error,
                "Error saving shift types or rates."
            );
            showToast(msg, "error");
            logError(error, "Saving Shift Types and Rates");
        } finally {
            saveBtn.disabled = false;
            spinner.classList.add("hidden");
        }
    });

// Show Location Modal (Tailwind version)
const locationModal = document.getElementById("locationModal");
const locationModalBackdrop = document.getElementById("locationModalBackdrop");
function showLocationModal() {
    locationModal.classList.remove("invisible");
    locationModal.classList.remove("hidden");
}
function hideLocationModal() {
    locationModal.classList.add("invisible");
    locationModal.classList.remove("hidden");
}
document
    .getElementById("showLocationModal")
    .addEventListener("click", function () {
        document.getElementById("locationForm").reset();
        document.getElementById("locationStatus").innerHTML = "";
        document.querySelectorAll("#locationForm .form-input").forEach((el) => {
            el.classList.remove("border-red-500");
        });
        showLocationModal();
    });
document
    .getElementById("closeLocationModal")
    .addEventListener("click", hideLocationModal);
// Add Location to Backend with validation and error display
// Updated to use apiService

document
    .getElementById("locationForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();
        let hasError = false;
        document.querySelectorAll("#locationForm .form-input").forEach((el) => {
            el.classList.remove("border-red-500");
        });
        document
            .querySelectorAll("#locationForm .text-red-500")
            .forEach((el) => {
                el.innerHTML = "";
            });
        const name = document.getElementById("loc_name");
        let nameValid = validateRequired(name, "Name is required.");
        if (!nameValid) {
            document.getElementById("loc_name_error").innerHTML =
                "Name is required.";
            hasError = true;
        }
        if (hasError) {
            showToast("Please fix validation errors before saving.", "error");
            return;
        }
        const formData = new FormData(this);
        const data = Object.fromEntries(formData.entries());
        try {
            let res = await apiService.createLocation(data);
            // const location = res.data;
            // locationsTable.appendChild(createLocationRow(location));
            hideLocationModal();
            showToast("Location saved successfully!", "success");
            fetchAndRenderAll();
        } catch (error) {
            let msg = extractAxiosErrorMsg(error, "Error saving location.");
            if (
                error.response &&
                error.response.data &&
                error.response.data.errors
            ) {
                for (const [field, messages] of Object.entries(
                    error.response.data.errors
                )) {
                    const input = document.getElementById("loc_" + field);
                    if (input) {
                        input.classList.add("border-red-500");
                        document.getElementById(
                            "loc_" + field + "_error"
                        ).innerHTML = messages.join("<br>");
                    }
                }
            }
            showToast(msg, "error");
            logError(error, "Saving Location");
        }
    });

// Toast-style confirm modal

// Remove Shift Type Row (backend deletion)
shiftRatesTable.addEventListener("click", async function (e) {
    if (e.target.classList.contains("remove-shift")) {
        try {
            const row = e.target.closest("tr");
            const shiftTypeId = row.getAttribute("data-id");
            if (shiftRatesTable.rows.length > 1) {
                await handleRemoveRow({
                    row,
                    id: shiftTypeId,
                    apiPath: "/api/shift-types",
                    successMsg: "Shift type deleted successfully!",
                    errorMsg: "Error deleting shift type.",
                    confirmMsg:
                        "Are you sure you want to delete this shift type?",
                    onAfterRemove: fetchAndRenderAll,
                });
            } else {
                showToast("Cannot delete the last shift type.", "warning");
            }
        } catch (error) {
            logError(error, "removeShiftType");
            showToast("Error removing shift type", "error");
        }
    }
});

// Remove Location Row (backend deletion)
locationsTable.addEventListener("click", async function (e) {
    if (e.target.classList.contains("remove-location")) {
        try {
            const row = e.target.closest("tr");
            const locationId = row.getAttribute("data-id");
            await handleRemoveRow({
                row,
                id: locationId,
                apiPath: "/api/locations",
                successMsg: "Location deleted successfully!",
                errorMsg: "Error deleting location.",
                confirmMsg: "Are you sure you want to delete this location?",
                onAfterRemove: fetchAndRenderAll,
            });
        } catch (error) {
            logError(error, "removeLocation");
            showToast("Error removing location", "error");
        }
    }
});

// Next Step Button (navigate to step 2)
document.getElementById("nextStepBtn").addEventListener("click", function (e) {
    try {
        e.preventDefault();

        // Check if there are any unsaved changes
        if (isGlobalLoading) {
            showToast(
                "Please wait for current operations to complete",
                "warning"
            );
            return;
        }

        // Validate at least one record in shift and location tables
        const shiftRows = document.querySelectorAll(
            "#shiftRatesTable tbody tr"
        );
        const locationRows = document.querySelectorAll(
            "#locationsTable tbody tr"
        );
        if (shiftRows.length === 0) {
            showToast(
                "Please add at least one shift type before proceeding.",
                "error"
            );
            return;
        }
        if (locationRows.length === 0) {
            showToast(
                "Please add at least one location before proceeding.",
                "error"
            );
            return;
        }

        window.location.href = "/home/step2";
    } catch (error) {
        logError(error, "nextStep");
        showToast("Error navigating to next step", "error");
    }
});

// On page load, fetch and render all data
window.addEventListener("DOMContentLoaded", async function () {
    try {
        await fetchAndRenderAll();
    } catch (error) {
        logError(error, "DOMContentLoaded");
        showToast("Error initializing page. Please refresh.", "error");
    }
});

import { apiService } from "../apiService";
import { showToast, validateRequired, extractAxiosErrorMsg } from "../helpers";
import { SelectionManager } from "./SelectionManager";

let shiftTypesChoices, locationChoices;

const selectionManager = new SelectionManager();

function addSelectionToOptions() {
    const shiftTypes = shiftTypesChoices
        .getValue(true)
        .map((item) => item.label);
    const locations = locationChoices.getValue(true).map((item) => item.label);
    const dateRange = document.getElementById("dateRange").value;

    try {
        selectionManager.addSelection(shiftTypes, locations, dateRange);
        showToast("Selection added successfully!", "success");
        setSummary(); // Update the summary
    } catch (error) {
        showToast(error.message, "error");
    }
}

function removeSelection(index) {
    try {
        selectionManager.removeSelection(index);
        showToast("Selection removed successfully!", "success");
        setSummary(); // Update the summary
    } catch (error) {
        showToast(error.message, "error");
    }
}

function setSummary() {
    const summary = document.getElementById("summarySection");

    // Clear the summary content
    summary.innerHTML = "";
    // Get the selected options from the SelectionManager
    const selectedOptions = selectionManager.getSelections();

    // Iterate over selectedOptions and display each selection
    selectedOptions.forEach((option, index) => {
        summary.innerHTML += `
            <div class="summary-content bg-gray-100 p-4 rounded-lg shadow-md mb-4">
                <p class="text-sm font-medium text-gray-700 mb-2">
                    <strong>Selection ${index + 1}:</strong>
                </p>
                <p class="text-sm font-medium text-gray-700 mb-2">
                    <strong>Shift Types:</strong> ${
                        option.shiftTypes.join(", ") || "None selected"
                    }
                </p>
                <p class="text-sm font-medium text-gray-700 mb-2">
                    <strong>Location:</strong> ${
                        option.locations.join(", ") || "Not selected"
                    }
                </p>
                <p class="text-sm font-medium text-gray-700">
                    <strong>Date Range:</strong> ${
                        option.dateRange || "Not selected"
                    }
                </p>
                                <button 
                    class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 focus:ring-2 focus:ring-red-400 mt-2"
                    onclick="removeSelection(${index})">
                    Remove
                </button>
            </div>
        `;
    });
}

async function loadStep2Options() {
    try {
        const [shiftTypes, locations] = await Promise.all([
            apiService.getShiftTypes(),
            apiService.getLocations(),
        ]);
        // Populate shift types
        const shiftTypesSelect = document.getElementById("shiftTypes");
        shiftTypes.forEach((st) => {
            const opt = document.createElement("option");
            opt.value = st.id;
            opt.textContent = st.name;
            shiftTypesSelect.appendChild(opt);
        });
        shiftTypesChoices = new Choices(shiftTypesSelect, {
            removeItemButton: true,
            placeholder: true,
            placeholderValue: "Select shift types",
            searchPlaceholderValue: "Type to search...",
            noResultsText: "No shift types found",
            noChoicesText: "No shift types available",
            itemSelectText: "",
            shouldSort: false,
        });
        // Populate locations
        const locationSelect = document.getElementById("location");
        locations.forEach((loc) => {
            const opt = document.createElement("option");
            opt.value = loc.id;
            opt.textContent = loc.name;
            locationSelect.appendChild(opt);
        });
        locationChoices = new Choices(locationSelect, {
            searchPlaceholderValue: "Type to search...",
            removeItemButton: true,
            searchEnabled: true,
            itemSelectText: "",
            shouldSort: false,
            placeholder: true,
            placeholderValue: "Select Location",
            noResultsText: "No locations found",
            noChoicesText: "No locations available",
        });
    } catch (error) {
        showToast(
            extractAxiosErrorMsg(error, "Failed to load options."),
            "error"
        );
    }
}

function validateStep2Form() {
    // Check if selectedOptions is empty
    if (!selectionManager.getSelections().length) {
        showToast(
            "Please add at least one selection before submitting.",
            "error"
        );
        return false;
    }

    return true;
}

document.addEventListener("DOMContentLoaded", function () {
    // Load saved selections from localStorage
    const savedSelections = localStorage.getItem("selectedOptions");
    if (savedSelections) {
        selectedOptions = JSON.parse(savedSelections);
        setSummary(); // Update the summary with the loaded selections
    }

    loadStep2Options().then(() => {
        // Pre-select values from session (window variables set in Blade)
        if (window.selectedShiftTypes && shiftTypesChoices) {
            shiftTypesChoices.setChoiceByValue(window.selectedShiftTypes);
        }
        if (window.selectedLocationId && locationChoices) {
            locationChoices.setChoiceByValue(window.selectedLocationId);
        }
        if (window.selectedDateRange) {
            document.getElementById("dateRange").value =
                window.selectedDateRange;
        }
    });
    flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        allowInput: true,
    });

    // Add event listener for the "Add" button
    const addSelectionBtn = document.getElementById("addSelectionBtn");
    if (addSelectionBtn) {
        addSelectionBtn.addEventListener("click", function () {
            addSelectionToOptions(); // Call the function to add the selection
            setSummary(); // Update the summary section
        });
    }

    const step2Form = document.getElementById("step2Form");
    step2Form.addEventListener("submit", function (e) {
        if (!validateStep2Form()) {
            e.preventDefault();
            return;
        }
        // Get the selectedOptions array from the SelectionManager
        const selectedOptions = selectionManager.getSelections();

        // Update the hidden input field with the selectedOptions array as JSON
        const selectedOptionsInput = document.getElementById(
            "selectedOptionsInput"
        );
        selectedOptionsInput.value = JSON.stringify(selectedOptions);
        showToast("Step 2 validated! Proceeding to next step...", "success");
        // Clear selections from localStorage
        selectionManager.clearSelections();
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

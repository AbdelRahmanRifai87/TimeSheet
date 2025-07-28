import { apiService } from "../apiService";
import { showToast, validateRequired, extractAxiosErrorMsg } from "../helpers";
import { SelectionManager } from "./SelectionManager";

let shiftTypesChoices, locationChoices;

const selectionManager = new SelectionManager();

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

async function loadStep2Options() {
    try {
        const [shiftTypes, locations] = await Promise.all([
            apiService.getShiftTypes(),
            apiService.getLocations(),
        ]);
        // Populate shift types for each location
        locations.forEach((location) => {
            const shiftTypesSelect = document.getElementById(
                `shiftTypes_${location.id}`
            );
            shiftTypes.forEach((st) => {
                const opt = document.createElement("option");
                opt.value = st.id;
                opt.textContent = st.name;
                shiftTypesSelect.appendChild(opt);
            });

            // Store the Choices.js instance in a global object
            if (!window.choicesInstances) {
                window.choicesInstances = {};
            }
            console.log("the shiftypes select element", shiftTypesSelect);
            window.choicesInstances[location.id] = new Choices(
                shiftTypesSelect,
                {
                    removeItemButton: true,
                    placeholder: true,
                    placeholderValue: "Select shift types",
                    searchPlaceholderValue: "Type to search...",
                    noResultsText: "No shift types found",
                    noChoicesText: "No shift types available",
                    itemSelectText: "",
                    shouldSort: false,
                    addItems: true, // Allow adding items dynamically
                    duplicateItemsAllowed: false, // Prevent duplicate items
                }
            );

            // Initialize Flatpickr for the date range input
            const dateRangeInput = document.getElementById(
                `dateRange_${location.id}`
            );
            flatpickr(dateRangeInput, {
                mode: "range", // Enable date range selection
                dateFormat: "Y-m-d", // Include time in the format
            });
        });
        // // Populate locations
        // const locationSelect = document.getElementById("location");
        // locations.forEach((loc) => {
        //     const opt = document.createElement("option");
        //     opt.value = loc.id;
        //     opt.textContent = loc.name;
        //     locationSelect.appendChild(opt);
        // });
        // locationChoices = new Choices(locationSelect, {
        //     searchPlaceholderValue: "Type to search...",
        //     removeItemButton: true,
        //     searchEnabled: true,
        //     itemSelectText: "",
        //     shouldSort: false,
        //     placeholder: true,
        //     placeholderValue: "Select Location",
        //     noResultsText: "No locations found",
        //     noChoicesText: "No locations available",
        // });
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
        ).map((option) => option.value);

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
            });
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    // Toggle visibility of the form for a specific location and update the arrow icon
    window.toggleForm = function (locationId) {
        const form = document.getElementById(`form_${locationId}`);
        const arrow = document.getElementById(`arrow_${locationId}`);

        // Toggle the hidden class
        form.classList.toggle("hidden");

        // Update the arrow icon
        if (form.classList.contains("hidden")) {
            arrow.innerHTML = '<i class="fas fa-chevron-down"></i>'; // Down arrow
        } else {
            arrow.innerHTML = '<i class="fas fa-chevron-up"></i>'; // Up arrow
        }
    };

    // Call the function to initialize Save buttons
    initializeSaveButtons();

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

export class SelectionManager {
    constructor(storageKey = "selectedOptions") {
        this.storageKey = storageKey;
        this.selectedOptions = this.loadSelections();
    }

    // Load selections from localStorage
    loadSelections() {
        const savedSelections = localStorage.getItem(this.storageKey);
        return savedSelections ? JSON.parse(savedSelections) : [];
    }

    // Save selections to localStorage
    saveSelections() {
        try {
            localStorage.setItem(
                this.storageKey,
                JSON.stringify(this.selectedOptions)
            );
        } catch (error) {
            console.error("Failed to save selections to localStorage:", error);
            throw new Error("Failed to save selections.");
        }
    }

    // Add a new selection
    addSelection(shiftTypes, locations, dateRange) {
        // Validate inputs
        if (!shiftTypes.length) {
            throw new Error("Please select at least one shift type.");
        }
        if (!locations.length) {
            throw new Error("Please select at least one location.");
        }
        if (!dateRange) {
            throw new Error("Please select a date range.");
        }

        const [startDate, endDate] = dateRange.split(" to ");
        if (!startDate || !endDate) {
            throw new Error("Please select both start and end dates.");
        }
        if (endDate < startDate) {
            throw new Error("End date cannot be before start date.");
        }

        // Check for duplicates
        const isDuplicate = this.selectedOptions.some(
            (option) =>
                JSON.stringify(option.shiftTypes) ===
                    JSON.stringify(shiftTypes) &&
                JSON.stringify(option.locations) ===
                    JSON.stringify(locations) &&
                option.dateRange === dateRange
        );
        if (isDuplicate) {
            throw new Error("This selection already exists.");
        }

        // Add the selection
        this.selectedOptions.push({ shiftTypes, locations, dateRange });
        this.saveSelections();
    }

    // Remove a selection by index
    removeSelection(index) {
        if (index < 0 || index >= this.selectedOptions.length) {
            throw new Error("Invalid index for removal.");
        }

        this.selectedOptions.splice(index, 1);
        this.saveSelections();
    }

    // Get all selections
    getSelections() {
        return this.selectedOptions;
    }
    // clear all selections from localStorage
    clearSelections() {
        this.selectedOptions = [];
        localStorage.removeItem(this.storageKey);
    }
}

import { showToast } from "./helpers.js";

document.addEventListener("DOMContentLoaded", function () {
    // Show Laravel error messages as toasts
    const errorList = document.querySelectorAll(
        "#laravel-errors .error-message"
    );
    errorList.forEach(function (el) {
        if (window.showToast) {
            window.showToast(el.textContent, "error");
        } else if (typeof showToast === "function") {
            showToast(el.textContent, "error");
        }
    });
});

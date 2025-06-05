import {applyZoom} from "./apply_zoom";
import {updateCalendarView} from './update_calendar_view.js';

// Function to adjust layout based on screen width and flap visibility
function adjustLayout(app) {
    const isNarrow = window.matchMedia('(max-width: 768px)').matches;
    const isFlapHidden = app.parametersFlap.classList.contains('hidden');

    // Get flap dimensions only if visible, otherwise 0.
    // offsetHeight will give current rendered height, which is good.
    // offsetWidth for wide screen.
    const flapHeight = isNarrow && !isFlapHidden ? app.parametersFlap.offsetHeight : 0;
    // For wide screens, use a fixed width or app.parametersFlap.offsetWidth if it's reliable when visible.
    // Sticking to 350px as it was previously hardcoded for wide screen visible flap.
    const flapWidthWide = !isNarrow && !isFlapHidden ? 350 : 0;


    if (isNarrow) {
        if (isFlapHidden) {
            app.calendarBackground.style.top = '0px';
            app.calendarBackground.style.height = '100%';
        } else {
            app.calendarBackground.style.top = flapHeight + 'px';
            app.calendarBackground.style.height = 'calc(100% - ' + flapHeight + 'px)';
        }
        app.calendarBackground.style.left = '0px';
        app.calendarBackground.style.width = '100%';
    } else { // Wide screen
        if (isFlapHidden) {
            app.calendarBackground.style.left = '0px';
            app.calendarBackground.style.width = '100%';
        } else {
            app.calendarBackground.style.left = flapWidthWide + 'px';
            app.calendarBackground.style.width = 'calc(100% - ' + flapWidthWide + 'px)';
        }
        app.calendarBackground.style.top = '0px';
        app.calendarBackground.style.height = '100%';
    }
}

export function addEventListeners(app){
    // Event listener for toggling parameters flap
    app.toggleParametersButton.addEventListener('click', () => {
        app.parametersFlap.classList.toggle('hidden');
        // Update button text based on flap visibility
        if (app.parametersFlap.classList.contains('hidden')) {
            app.toggleParametersButton.textContent = 'Show Parameters';
        } else {
            app.toggleParametersButton.textContent = 'Hide Parameters';
        }
        // Adjust layout after toggling
        adjustLayout(app);
    });

    // Add event listeners to form inputs for automatic regeneration
    const formInputs = app.calendarForm.querySelectorAll('input, select');
    formInputs.forEach(input => {
        input.addEventListener('input', () => { // 'input' for text/number, works for select too
            // For select, 'change' is more traditional but 'input' often works
            // Debounce or throttle this if performance becomes an issue with rapid changes
            updateCalendarView(app);
        });
    });

    // Initial calendar generation on page load
    document.addEventListener('DOMContentLoaded', () => {
        // Set initial button text based on flap visibility (assuming it's visible by default unless CSS hides it)
        if (app.parametersFlap.classList.contains('hidden')) {
            app.toggleParametersButton.textContent = 'Show Parameters';
        } else {
            app.toggleParametersButton.textContent = 'Hide Parameters';
        }

        // Set default dates if not already set
        if (app.startDateInput && !app.startDateInput.value) {
            app.startDateInput.value = "2000-01-01";
        }
        if (app.specialDateInput && !app.specialDateInput.value) {
            app.specialDateInput.value = "2000-01-01";
        }

        updateCalendarView(app); // This will call applyZoom internally

        // Set initial layout
        adjustLayout(app);
    });

    // Adjust layout on window resize
    window.addEventListener('resize', () => adjustLayout(app));

    // Zoom functionality
    app.zoomInButton.addEventListener('click', () => {
        app.currentZoom += app.zoomStep;
        applyZoom(app);
    });

    app.zoomOutButton.addEventListener('click', () => {
        app.currentZoom = Math.max(0.1, app.currentZoom - app.zoomStep); // Prevent zoom from becoming too small
        applyZoom(app);
    });

    // Pan functionality (REMOVED - native scroll is used)

    // Drag-to-scroll functionality
    let isDragging = false;
    let initialClientX = 0;
    let initialClientY = 0;
    let initialScrollLeft = 0;
    let initialScrollTop = 0;

    if (app.zoomableScrollableContainer && app.calendarBackground) {
        app.zoomableScrollableContainer.addEventListener('mousedown', (event) => {
            isDragging = true;
            initialClientX = event.clientX;
            initialClientY = event.clientY;
            initialScrollLeft = app.calendarBackground.scrollLeft;
            initialScrollTop = app.calendarBackground.scrollTop;
            app.calendarBackground.style.cursor = 'grabbing'; // Target calendarBackground for cursor
            event.preventDefault(); // Prevent text selection, etc.
        });

        // Attach mousemove to document for smoother dragging even if cursor leaves the container
        document.addEventListener('mousemove', (event) => {
            if (!isDragging) return;
            event.preventDefault(); // Prevent text selection during drag

            const deltaX = event.clientX - initialClientX;
            const deltaY = event.clientY - initialClientY;

            // Adjust scroll based on delta. Sensitivity is 1:1 with mouse movement.
            app.calendarBackground.scrollLeft = initialScrollLeft - deltaX;
            app.calendarBackground.scrollTop = initialScrollTop - deltaY;
        });

        // Attach mouseup to document to catch mouse release anywhere
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (app.calendarBackground) { // Ensure calendarBackground exists
                    app.calendarBackground.style.cursor = 'grab'; // Target calendarBackground for cursor
                }
            }
        });

        // Handle mouse leaving the container while dragging
        app.zoomableScrollableContainer.addEventListener('mouseleave', () => {
            // No longer needed to set isDragging = false here if mouseup is on document.
            // However, keeping cursor style change if needed, or if mouseup on document is removed.
            // For now, if mouseup is on document, this specific handler might not be strictly necessary
            // for isDragging, but can be kept for cursor or other specific exit behaviors.
            // If mouseup is on document, dragging continues even if mouse leaves and re-enters.
            // If user releases mouse button *outside* the window/document, then mouseup might not fire.
            // This is a general browser behavior.
            // For this implementation, we assume document mouseup is sufficient.
            // If isDragging is true and mouse leaves, cursor should remain 'grabbing' until mouse up.
        });

        // Initial cursor style for the scrollable area
        if (app.calendarBackground) { // Ensure calendarBackground exists
            app.calendarBackground.style.cursor = 'grab';
        }

    } else {
        console.error("zoomableScrollableContainer or calendarBackground not found. Drag-to-scroll will not work.");
    }


    // The old generateButton and its listener are removed as the button itself is gone from HTML.

}
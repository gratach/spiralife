import {createCalendarSvg} from './create_calendar_svg.js'
import { applyZoom } from './apply_zoom.js';

// Function to generate and display the calendar
export function updateCalendarView(app) {
    try {
        // Clear previous errors
        app.errorMessageContainer.innerHTML = '';
        app.errorMessageContainer.style.display = 'none';

        // Read parameter values
        const imageWidth = parseInt(app.imageWidthInput.value, 10);
        const imageHeight = parseInt(app.imageHeightInput.value, 10);
        const imageUnit = app.imageUnitInput.value;
        const startDateValue = app.startDateInput.value; // e.g., "2000-01-01"
        let startYear, startMonth, startDay;
        if (startDateValue) {
            const parts = startDateValue.split('-');
            startYear = parseInt(parts[0], 10);
            startMonth = parseInt(parts[1], 10); // This is 1-indexed
            startDay = parseInt(parts[2], 10);
        } else {
            // Default values if the date input is somehow empty, though type="date" usually prevents this
            // Or, rely on the initial value set in DOMContentLoaded
            startYear = 2000;
            startMonth = 1; // 1-indexed
            startDay = 1;
        }
        const totalDays = parseInt(app.totalDaysInput.value, 10);
        const rotationConstant = parseFloat(app.rotationConstantInput.value); // Verified: Already parseFloat
        const language = app.languageInput.value;
        const specialDateValue = app.specialDateInput.value; // e.g., "2000-01-01"
        let specialDayYear, specialDayMonth, specialDayDay;
        if (specialDateValue) {
            const parts = specialDateValue.split('-');
            specialDayYear = parseInt(parts[0], 10);
            specialDayMonth = parseInt(parts[1], 10); // This is 1-indexed
            specialDayDay = parseInt(parts[2], 10);
        } else {
            // Default values if the date input is somehow empty
            specialDayYear = 2000;
            specialDayMonth = 1; // 1-indexed
            specialDayDay = 1;
        }
        const backgroundColor = app.backgroundColorInput.value || '#000000'; // Default to black if empty
        const emptyTurnsInMiddle = parseFloat(app.emptyTurnsInMiddleInput.value); // Changed to parseFloat
        const additionalTurnsBeyondBorder = parseFloat(app.additionalTurnsBeyondBorderInput.value); // Changed to parseFloat
        
        let filename = app.outputFileNameInput.value;
        if (!filename || filename.trim() === "") {
            filename = "calendar.svg";
        }
        if (!filename.toLowerCase().endsWith('.svg')) {
            filename += '.svg';
        }

        // Validate inputs (basic example, can be expanded)
        if (isNaN(imageWidth) || isNaN(imageHeight) || isNaN(startYear) || isNaN(startMonth) ||
            isNaN(startDay) || isNaN(totalDays) || isNaN(rotationConstant) || isNaN(specialDayYear) ||
            isNaN(specialDayMonth) || isNaN(specialDayDay) || isNaN(emptyTurnsInMiddle) || isNaN(additionalTurnsBeyondBorder)) {
            throw new Error("Invalid input: Ensure all numeric fields are correctly filled.");
        }
        if (startMonth < 1 || startMonth > 12 || specialDayMonth < 1 || specialDayMonth > 12) {
            throw new Error("Invalid month: Month must be between 1 and 12.");
        }
        // Add more specific day validation based on month/year if needed

        const calendarParameters = {
            image_width: imageWidth,
            image_height: imageHeight,
            image_unit: imageUnit,
            start_year: startYear,
            start_month: startMonth,
            start_day: startDay,
            total_days: totalDays,
            ui_total_turns: rotationConstant,
            language: language,
            ui_empty_turns: emptyTurnsInMiddle,
            ui_additional_turns: additionalTurnsBeyondBorder,
            special_day_year: specialDayYear,
            special_day_month: specialDayMonth,
            special_day_day: specialDayDay,
            background_color: backgroundColor, // Corrected parameter name
            output_file: filename,
        };

        // console.log("Calendar Parameters:", calendarParameters); // Keep for debugging if needed

        const svgString = createCalendarSvg(calendarParameters);
        
        app.svgContainer.innerHTML = svgString;
        const svgElement = app.svgContainer.querySelector('svg');
        if (svgElement) {
            svgElement.style.userSelect = 'none';
            svgElement.style.webkitUserSelect = 'none'; // Safari
            svgElement.style.mozUserSelect = 'none';    // Firefox
            svgElement.style.msUserSelect = 'none';     // IE/Edge
        }

        // Reset pan on new calendar generation (REMOVED)
        // Apply current zoom and reset pan (REMOVED)
        applyZoom(app); // Apply zoom after new SVG is rendered and sized

        // console.log("Generated SVG String length:", svgString.length); // Keep for debugging

        if (app.currentObjectUrl) {
            URL.revokeObjectURL(app.currentObjectUrl);
        }

        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        app.currentObjectUrl = url; 

        app.downloadLink.href = url;
        app.downloadLink.download = filename; 
        app.downloadLink.style.display = 'block';
        app.downloadLink.textContent = `Download ${filename}`;

        // Update calendar background color if #calendarBackground is used for it
        if (app.calendarBackground) {
            // This assumes the SVG's own background rect is what shows the color.
            // If #calendarBackground itself needs to change color (e.g., for areas outside SVG), do:
            // app.calendarBackground.style.backgroundColor = backgroundColor;
        }

    } catch (error) {
        console.error("Error generating calendar:", error);
        app.errorMessageContainer.innerHTML = `<p>Error generating calendar: ${error.message}</p>`;
        app.errorMessageContainer.style.display = 'block';
        app.svgContainer.innerHTML = ''; // Clear SVG container on error
        app.downloadLink.style.display = 'none'; // Hide download link on error
    }
}
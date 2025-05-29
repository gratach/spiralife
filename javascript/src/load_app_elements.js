// localStorage keys
const LKEY_WEEKDAY_COLORS = 'spiralCalendar.weekdayColors';
const LKEY_MONTH_COLORS = 'spiralCalendar.monthColors';
const LKEY_SPECIAL_DAY_COLOR = 'spiralCalendar.specialDayColor';

// Helper to check if a value is a valid RGB array (duplicate from create_calendar_svg.js for encapsulation)
function isValidRgb(rgb) {
    return Array.isArray(rgb) && rgb.length === 3 && rgb.every(val => typeof val === 'number' && val >= 0 && val <= 255);
}

// Helper to check if an array of colors is valid (duplicate from create_calendar_svg.js for encapsulation)
function isValidColorArray(colors, expectedLength) {
    return Array.isArray(colors) && colors.length === expectedLength && colors.every(isValidRgb);
}

// Helper function to convert Hex to RGB
function hexToRgb(hex) {
    if (!hex) return null;
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
        return r + r + g + g + b + b;
    });
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

// Helper function to convert RGB to Hex
function rgbToHex(r, g, b) {
    if (r === undefined || g === undefined || b === undefined || r === null || g === null || b === null) return "#000000"; // Default to black if any component is missing
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0');
}

export const DEFAULTS = {
    imageWidth: 2000,
    imageHeight: 1500,
    imageUnit: 'px',
    startDate: new Date().toISOString().split('T')[0], // Default to today
    totalDays: 36526, // Approx 100 years
    emptyTurnsInMiddle: 0.5,
    additionalTurnsBeyondBorder: 1.0,
    rotationConstant: 100,
    language: 'en',
    specialDate: '',
    backgroundColor: '#000000', // This is for the SVG background
    outputFileName: 'calendar.svg',
    // UI color arrays (RGB)
    // Order: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
    weekday_colors_ui: [ 
        [255, 255, 255], // Sunday
        [255, 255, 255], // Monday
        [255, 255, 255], // Tuesday
        [255, 255, 255], // Wednesday
        [255, 255, 255], // Thursday
        [130, 255, 100], // Friday
        [255, 100, 15]   // Saturday
    ],
    month_colors_ui: [ // January to December
        [2, 100, 255], [44, 120, 210], [33, 180, 100], [100, 240, 120], [230, 222, 90], [255, 140, 0],
        [255, 0, 0], [190, 180, 0], [200, 180, 100], [190, 210, 100], [150, 150, 150], [70, 90, 120]
    ],
    special_day_color_ui: [255, 255, 0] // RGB
};

export function loadAppElements(){
    let app = {};

    // Get references to DOM elements
    app.imageWidthInput = document.getElementById('imageWidth');
    app.imageHeightInput = document.getElementById('imageHeight');
    app.imageUnitInput = document.getElementById('imageUnit');
    app.startDateInput = document.getElementById('startDate');
    app.totalDaysInput = document.getElementById('totalDays');
    app.rotationConstantInput = document.getElementById('rotationConstant');
    app.languageInput = document.getElementById('language');
    app.specialDateInput = document.getElementById('specialDate');
    app.backgroundColorInput = document.getElementById('backgroundColor');
    app.outputFileNameInput = document.getElementById('outputFileName');
    app.emptyTurnsInMiddleInput = document.getElementById('emptyTurnsInMiddle');
    app.additionalTurnsBeyondBorderInput = document.getElementById('additionalTurnsBeyondBorder');
    app.svgContainer = document.getElementById('svgContainer');
    app.downloadLink = document.getElementById('downloadLink');
    app.calendarForm = document.getElementById('calendarForm'); // Added for easy access to form inputs

    // Weekday color inputs
    app.mondayColorInput = document.getElementById('mondayColor');
    app.tuesdayColorInput = document.getElementById('tuesdayColor');
    app.wednesdayColorInput = document.getElementById('wednesdayColor');
    app.thursdayColorInput = document.getElementById('thursdayColor');
    app.fridayColorInput = document.getElementById('fridayColor');
    app.saturdayColorInput = document.getElementById('saturdayColor');
    app.sundayColorInput = document.getElementById('sundayColor');

    // Month color inputs
    const monthIds = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    monthIds.forEach(month => {
        app[month + 'ColorInput'] = document.getElementById(month + 'Color');
    });

    // Special day color input
    app.specialDayColorInput = document.getElementById('specialDayColor');

    // New UI elements
    app.parametersFlap = document.getElementById('parametersFlap');
    app.toggleParametersButton = document.getElementById('toggleParametersButton');
    app.zoomInButton = document.getElementById('zoomInButton');
    app.zoomOutButton = document.getElementById('zoomOutButton');
    app.zoomableScrollableContainer = document.getElementById('zoomableScrollableContainer');
    app.errorMessageContainer = document.getElementById('errorMessageContainer');
    app.calendarBackground = document.getElementById('calendarBackground');

    return app;
}

export function collect_parameters(app) {
    const parameters = {};
    // Standard parameters
    parameters.imageWidth = parseInt(app.imageWidthInput.value, 10);
    parameters.imageHeight = parseInt(app.imageHeightInput.value, 10);
    parameters.imageUnit = app.imageUnitInput.value;
    parameters.startDate = app.startDateInput.value;
    parameters.totalDays = parseInt(app.totalDaysInput.value, 10);
    parameters.emptyTurnsInMiddle = parseFloat(app.emptyTurnsInMiddleInput.value);
    parameters.additionalTurnsBeyondBorder = parseFloat(app.additionalTurnsBeyondBorderInput.value);
    parameters.rotationConstant = parseFloat(app.rotationConstantInput.value);
    parameters.language = app.languageInput.value;
    parameters.specialDate = app.specialDateInput.value;
    parameters.backgroundColor = app.backgroundColorInput.value; // Hex for SVG background
    parameters.outputFileName = app.outputFileNameInput.value;

    // UI Theme Colors - convert hex from inputs to RGB arrays for parameters object
    // Weekday colors: HTML inputs are Mon-Sun. Parameters object needs Sun-Sat.
    const sundayRgb = hexToRgb(app.sundayColorInput.value);
    const mondayRgb = hexToRgb(app.mondayColorInput.value);
    const tuesdayRgb = hexToRgb(app.tuesdayColorInput.value);
    const wednesdayRgb = hexToRgb(app.wednesdayColorInput.value);
    const thursdayRgb = hexToRgb(app.thursdayColorInput.value);
    const fridayRgb = hexToRgb(app.fridayColorInput.value);
    const saturdayRgb = hexToRgb(app.saturdayColorInput.value);
    parameters.weekday_colors_ui = [sundayRgb, mondayRgb, tuesdayRgb, wednesdayRgb, thursdayRgb, fridayRgb, saturdayRgb];

    // Month colors
    const monthIds = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    parameters.month_colors_ui = monthIds.map(month => hexToRgb(app[month + 'ColorInput'].value));

    // Special day color
    parameters.special_day_color_ui = hexToRgb(app.specialDayColorInput.value);

    // Save color settings to localStorage
    try {
        if (parameters.weekday_colors_ui) {
            localStorage.setItem(LKEY_WEEKDAY_COLORS, JSON.stringify(parameters.weekday_colors_ui));
        }
        if (parameters.month_colors_ui) {
            localStorage.setItem(LKEY_MONTH_COLORS, JSON.stringify(parameters.month_colors_ui));
        }
        if (parameters.special_day_color_ui) {
            localStorage.setItem(LKEY_SPECIAL_DAY_COLOR, JSON.stringify(parameters.special_day_color_ui));
        }
    } catch (e) {
        console.error("Error saving color settings to localStorage:", e);
    }

    return parameters;
}

export function populate_form_from_parameters(params, app) {
    // Standard parameters
    app.imageWidthInput.value = params.imageWidth !== undefined ? params.imageWidth : DEFAULTS.imageWidth;
    app.imageHeightInput.value = params.imageHeight !== undefined ? params.imageHeight : DEFAULTS.imageHeight;
    app.imageUnitInput.value = params.imageUnit || DEFAULTS.imageUnit;
    app.startDateInput.value = params.startDate || DEFAULTS.startDate;
    app.totalDaysInput.value = params.totalDays !== undefined ? params.totalDays : DEFAULTS.totalDays;
    app.emptyTurnsInMiddleInput.value = params.emptyTurnsInMiddle !== undefined ? params.emptyTurnsInMiddle : DEFAULTS.emptyTurnsInMiddle;
    app.additionalTurnsBeyondBorderInput.value = params.additionalTurnsBeyondBorder !== undefined ? params.additionalTurnsBeyondBorder : DEFAULTS.additionalTurnsBeyondBorder;
    app.rotationConstantInput.value = params.rotationConstant !== undefined ? params.rotationConstant : DEFAULTS.rotationConstant;
    app.languageInput.value = params.language || DEFAULTS.language;
    app.specialDateInput.value = params.specialDate || DEFAULTS.specialDate;
    app.backgroundColorInput.value = params.backgroundColor || DEFAULTS.backgroundColor; // SVG Background
    app.outputFileNameInput.value = params.outputFileName || DEFAULTS.outputFileName;

    // UI Theme Colors - Convert RGB from parameters (or DEFAULTS) to Hex for inputs
    // Weekday Colors: params.weekday_colors_ui is Sun-Sat. HTML inputs are Mon-Sun order in app object, but we map correctly.
    const weekdayColorsToUse = params.weekday_colors_ui || DEFAULTS.weekday_colors_ui;
    // app.sundayColorInput is the input for Sunday, weekdayColorsToUse[0] is Sunday's color.
    app.sundayColorInput.value    = rgbToHex(...(weekdayColorsToUse[0] || DEFAULTS.weekday_colors_ui[0]));
    app.mondayColorInput.value    = rgbToHex(...(weekdayColorsToUse[1] || DEFAULTS.weekday_colors_ui[1]));
    app.tuesdayColorInput.value   = rgbToHex(...(weekdayColorsToUse[2] || DEFAULTS.weekday_colors_ui[2]));
    app.wednesdayColorInput.value = rgbToHex(...(weekdayColorsToUse[3] || DEFAULTS.weekday_colors_ui[3]));
    app.thursdayColorInput.value  = rgbToHex(...(weekdayColorsToUse[4] || DEFAULTS.weekday_colors_ui[4]));
    app.fridayColorInput.value    = rgbToHex(...(weekdayColorsToUse[5] || DEFAULTS.weekday_colors_ui[5]));
    app.saturdayColorInput.value  = rgbToHex(...(weekdayColorsToUse[6] || DEFAULTS.weekday_colors_ui[6]));

    // Month Colors
    const monthColorsToUse = params.month_colors_ui || DEFAULTS.month_colors_ui;
    const monthIds = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    monthIds.forEach((month, index) => {
        const colorRgbArray = monthColorsToUse[index] || DEFAULTS.month_colors_ui[index];
        if (app[month + 'ColorInput'] && colorRgbArray) {
             app[month + 'ColorInput'].value = rgbToHex(...colorRgbArray);
        } else if (app[month + 'ColorInput']) { // Fallback if somehow params/defaults are missing for a month
            app[month + 'ColorInput'].value = rgbToHex(...DEFAULTS.month_colors_ui[index]);
        }
    });

    // Special Day Color
    const specialDayColorToUse = params.special_day_color_ui || DEFAULTS.special_day_color_ui;
    if (app.specialDayColorInput && specialDayColorToUse) {
        app.specialDayColorInput.value = rgbToHex(...specialDayColorToUse);
    } else if (app.specialDayColorInput) { // Fallback
        app.specialDayColorInput.value = rgbToHex(...DEFAULTS.special_day_color_ui);
    }
}

export function load_initial_parameters() {
    // Start with a deep copy of DEFAULTS to avoid modifying the original
    let params = JSON.parse(JSON.stringify(DEFAULTS));

    try {
        // Load weekday colors
        const storedWeekdayColors = localStorage.getItem(LKEY_WEEKDAY_COLORS);
        if (storedWeekdayColors) {
            const parsedColors = JSON.parse(storedWeekdayColors);
            if (isValidColorArray(parsedColors, 7)) {
                params.weekday_colors_ui = parsedColors;
            } else {
                console.warn("Invalid weekday colors found in localStorage. Using defaults.");
            }
        }

        // Load month colors
        const storedMonthColors = localStorage.getItem(LKEY_MONTH_COLORS);
        if (storedMonthColors) {
            const parsedColors = JSON.parse(storedMonthColors);
            if (isValidColorArray(parsedColors, 12)) {
                params.month_colors_ui = parsedColors;
            } else {
                console.warn("Invalid month colors found in localStorage. Using defaults.");
            }
        }

        // Load special day color
        const storedSpecialDayColor = localStorage.getItem(LKEY_SPECIAL_DAY_COLOR);
        if (storedSpecialDayColor) {
            const parsedColor = JSON.parse(storedSpecialDayColor);
            if (isValidRgb(parsedColor)) {
                params.special_day_color_ui = parsedColor;
            } else {
                console.warn("Invalid special day color found in localStorage. Using defaults.");
            }
        }
    } catch (e) {
        console.error("Error loading color settings from localStorage:", e);
        // If localStorage is corrupted or inaccessible, params will remain as DEFAULTS (or whatever was partially loaded)
    }

    // Note: Standard parameters (non-color) are not loaded from localStorage in this design.
    // They are expected to be handled by DEFAULTS and then URL parameter overrides on form fields.
    return params;
}
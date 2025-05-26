import './style.css'; // Import CSS for styling

let currentObjectUrl = null; // For revoking previous object URLs

// Zoom State Variables
let currentZoom = 1;
const zoomStep = 0.1; // Or your preferred step

const MONTH_NAMES = {
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    de: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
    fr: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"],
    es: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
};

const weekday_colors = [[255, 255, 255],[255, 255, 255],[255, 255, 255],[255, 255, 255],[255, 255, 255],[130, 255, 100],[255, 100, 15]]; // Assuming Sun-Sat order for JS getDay()
const month_colors = [[2, 100, 255],[44, 120, 210],[33, 180, 100],[100, 240, 120],[230, 222, 90],[255, 140, 0],[255, 0, 0],[190, 180, 0],[200, 180, 100],[190, 210, 100],[150, 150, 150],[70, 90, 120]];

// Helper functions translated from Python (Geometric)
function calculate_midpoint(point1_x, point1_y, point2_x, point2_y, factor) {
    return {
        x: point1_x + (point2_x - point1_x) * factor,
        y: point1_y + (point2_y - point1_y) * factor
    };
}

function project_point_to_rectangle_edges(point_x, point_y, rect_width, rect_height) {
    if (point_x === 0 && point_y === 0) {
        return { x: 0, y: 0 };
    }
    const half_rect_width = rect_width / 2;
    const half_rect_height = rect_height / 2;
    let scale_factor;
    if (Math.abs(point_x) / half_rect_width > Math.abs(point_y) / half_rect_height) {
        scale_factor = half_rect_width / Math.abs(point_x);
    } else {
        scale_factor = half_rect_height / Math.abs(point_y);
    }
    return {
        x: point_x * scale_factor,
        y: point_y * scale_factor
    };
}

function project_point_within_circle_to_rectangle(point_x, point_y, rect_width, rect_height) {
    const { x: projected_edge_x, y: projected_edge_y } = project_point_to_rectangle_edges(point_x, point_y, rect_width, rect_height);
    const half_rect_width = rect_width / 2;
    const half_rect_height = rect_height / 2;
    const min_dimension_radius = Math.min(half_rect_height, half_rect_width);
    const distance_from_origin = Math.sqrt(point_x * point_x + point_y * point_y);
    
    if (distance_from_origin === 0) {
        return { x: 0, y: 0 };
    }

    const scaled_circular_x = point_x * min_dimension_radius; // Changed
    const scaled_circular_y = point_y * min_dimension_radius; // Changed
    
    return calculate_midpoint(
        scaled_circular_x,
        scaled_circular_y,
        projected_edge_x * distance_from_origin, // Changed
        projected_edge_y * distance_from_origin, // Changed
        distance_from_origin 
    );
}

// Helper functions translated from Python (Color)
function to_hex_string(value) {
    const v = Math.max(0, Math.min(255, Math.round(value))); // Ensure value is int 0-255
    const hex = v.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

function complementary_color(color_rgb) {
    return [
        (color_rgb[0] + 128) % 256,
        (color_rgb[1] + 128) % 256,
        (color_rgb[2] + 128) % 256
    ];
}

function format_color_string(color_rgb) {
    return `#${to_hex_string(color_rgb[0])}${to_hex_string(color_rgb[1])}${to_hex_string(color_rgb[2])}`;
}

function format_rgb_string(color_rgb) { // For stroke and fill attributes that take rgb()
    return `rgb(${Math.round(color_rgb[0])},${Math.round(color_rgb[1])},${Math.round(color_rgb[2])})`;
}


function add_color_values(val1, val2) {
    let result = val1 + val2;
    if (result < 0) return 0;
    if (result > 255) return 255;
    return result;
}

function add_colors(color1_rgb, color2_rgb) {
    return [
        add_color_values(color1_rgb[0], color2_rgb[0]),
        add_color_values(color1_rgb[1], color2_rgb[1]),
        add_color_values(color1_rgb[2], color2_rgb[2])
    ];
}


function createCalendar(parameters) {
    /*
    The spiral starts in the middle and spirals outwards.
    For once we ignore the square transformation and just look at the spiral within the circle of radius 1.
    The spiral line between the boxes is defined by the following parameters:
        The parameter current_line_turns defines the number of turns of the line inbetween the day boxes from the origin to the current position.
        The parameter total_line_turns defines the number of turns when the line intersects the circle of radius 1.
        The parameter current_line_radius defines the distance from the origin to the current position of the line.
            current_line_radius = current_line_turns / total_line_turns
        The parameter current_line_distance defines the distance from the origin to the current position of the line.
            current_line_distance = integral_{0}^{current_line_turns}{(2 * pi * current_line_radius') d(current_line_turns')}
                                = current_line_turns^2 / total_line_turns * pi
    The spiral of boxes is bounded by the spiral line at the inner and outer side.
    The spiral of boxes is defined by the following parameters:
        The parameter total_box_count defines the number of boxes in the spiral.
        The parameter outer_box_start_turns is the number of turns on the line where the outer side of the first box starts.
            It has to be at least 1 because the inner side of the first box is one turn before the outer side.
        The parameter outer_box_end_turns is the number of turns on the line where the outer side of the last box ends.
            This can be larger than total_line_turns. In this case the outer spial boxes fade out the image.
        The parameter total_box_turns is the number of turns from the beginning of the first box to the end of the last box.
            total_box_turns = outer_box_end_turns - outer_box_start_turns
        The parameter additional_turns is the difference between the outer_box_end_turns and the total_line_turns.
            additional_turns = outer_box_end_turns - total_line_turns
        The parameter total_box_distance is the distance on the outer line from the beginning of the first box to the end of the last box.
            total_box_distance = integral_{outer_box_start_turns}^{outer_box_end_turns}{(2 * pi * current_line_radius') d(current_line_turns')}
                               = (outer_box_end_turns^2 - outer_box_start_turns^2) / total_line_turns * pi
        The parameter box_width is the width of the boxes in the spiral measured at the outer side.
            box_width = total_box_distance / total_box_count

    The input parameters are:
        total_box_turns (this parameter is actually called "total turns" in the input)
        total_box_count (this parameter is actually called "total days" in the input)
        additional_turns (this parameter is actually called "turns beyond the image border")
        empty_turns_in_the_middle (this parameter is actually called "empty turns in the middle" in the input)
            This is defined as outer_box_start_turns - 1.
    */
    const current_month_names = MONTH_NAMES[parameters.language] || MONTH_NAMES["en"];

    // Retrieve Parameters (Subtask Item 1)
    const ui_total_box_count = parameters.total_days;
    const ui_total_turns = parameters.ui_total_turns;
    const ui_empty_turns = parameters.ui_empty_turns;
    const ui_additional_turns = parameters.ui_additional_turns;

    // Calculate Core Spiral Definition Parameters (Subtask Item 2)
    const outer_box_start_turns = ui_empty_turns + 1;
    const total_box_turns_val = ui_total_turns;
    const outer_box_end_turns = total_box_turns_val + outer_box_start_turns;
    let total_line_turns = outer_box_end_turns - ui_additional_turns;
    if (total_line_turns <= 0) { 
        console.warn('total_line_turns is not positive, defaulting. Original value:', total_line_turns, 'Using Math.max(1, total_box_turns_val):', Math.max(1, total_box_turns_val)); 
        total_line_turns = Math.max(1, total_box_turns_val); 
    }

    const image_width = parameters.image_width;
    const image_height = parameters.image_height;

    let svg_elements_parts = [];
    svg_elements_parts.push(`<svg width="${image_width}${parameters.image_unit}" height="${image_height}${parameters.image_unit}" viewBox="${-image_width/2} ${-image_height/2} ${image_width} ${image_height}" xmlns="http://www.w3.org/2000/svg" version="1.1" baseProfile="full">`);
    svg_elements_parts.push(`<rect x="${-image_width/2}" y="${-image_height/2}" width="${image_width}" height="${image_height}" fill="${parameters.background_color}" />`);

    // Helper functions for arc length calculations (Subtask Item 2)
    function turns_to_distance(turns, total_line_turns_val) {
        if (total_line_turns_val <= 0) return 0;
        const effective_turns = Math.max(0, turns);
        return (effective_turns * effective_turns) / total_line_turns_val * Math.PI;
    }

    function distance_to_turns(distance, total_line_turns_val) {
        if (distance < 0 || total_line_turns_val <= 0 || Math.PI === 0) return 0;
        return Math.sqrt(distance * total_line_turns_val / Math.PI);
    }

    // Calculate Arc Distances and Width (Subtask Item 3)
    const initial_outer_edge_start_distance = turns_to_distance(outer_box_start_turns, total_line_turns);
    const final_outer_edge_end_distance = turns_to_distance(outer_box_end_turns, total_line_turns);
    const total_scroll_distance_on_outer_line = final_outer_edge_end_distance - initial_outer_edge_start_distance;
    const box_arc_width_on_outer_line = (ui_total_box_count > 0) ? total_scroll_distance_on_outer_line / ui_total_box_count : 0;

    // Helper function for coordinate calculation (Subtask Item 4 - Verified)
    function get_coords_for_turn(turn_value, total_line_turns_val) {
        if (total_line_turns_val <= 0) return { x: 0, y: 0 };
        let radius = turn_value / total_line_turns_val;
        radius = Math.max(0, radius); // Ensure radius is not negative
        const theta = turn_value * 2 * Math.PI;
        return { x: Math.sin(theta) * radius, y: Math.cos(theta) * radius };
    }

    // Initialize prev_... coordinates for the start of the first day segment (Subtask Item 4 - Revised)
    const initial_turn_outer = outer_box_start_turns;
    // Initialize prev_... Coordinates (Subtask Item 5)
    let turn_outer_prev = outer_box_start_turns;
    let turn_inner_prev = Math.max(0, turn_outer_prev - 1);
    let { x: raw_prev_outer_x, y: raw_prev_outer_y } = get_coords_for_turn(turn_outer_prev, total_line_turns);
    let { x: raw_prev_inner_x, y: raw_prev_inner_y } = get_coords_for_turn(turn_inner_prev, total_line_turns);
    
    let proj_prev_outer = project_point_within_circle_to_rectangle(raw_prev_outer_x, raw_prev_outer_y, image_width, image_height);
    let proj_prev_inner = project_point_within_circle_to_rectangle(raw_prev_inner_x, raw_prev_inner_y, image_width, image_height);
    
    let prev_outer_x = proj_prev_outer.x;
    let prev_outer_y = proj_prev_outer.y;
    let prev_inner_x = proj_prev_inner.x;
    let prev_inner_y = proj_prev_inner.y;

    let current_date = new Date(parameters.start_year, parameters.start_month - 1, parameters.start_day);
    const special_day = new Date(parameters.special_day_year, parameters.special_day_month - 1, parameters.special_day_day);

    let special_day_markers = [];
    let text_elements = []; 
    let day_marker_lines = []; 

    // Main loop (Subtask Item 6)
    for (let i = 0; i < ui_total_box_count; i++) {
        // Calculate current day's outer edge position based on arc distance
        const current_day_outer_edge_end_scroll_distance = initial_outer_edge_start_distance + (i + 1) * box_arc_width_on_outer_line;
        let turn_outer_curr = distance_to_turns(current_day_outer_edge_end_scroll_distance, total_line_turns);
        let turn_inner_curr = Math.max(0, turn_outer_curr - 1);

        // Get raw coordinates for current points
        let { x: raw_curr_outer_x, y: raw_curr_outer_y } = get_coords_for_turn(turn_outer_curr, total_line_turns);
        let { x: raw_curr_inner_x, y: raw_curr_inner_y } = get_coords_for_turn(turn_inner_curr, total_line_turns);

        // Project current raw coordinates
        let proj_curr_outer = project_point_within_circle_to_rectangle(raw_curr_outer_x, raw_curr_outer_y, image_width, image_height);
        let proj_curr_inner = project_point_within_circle_to_rectangle(raw_curr_inner_x, raw_curr_inner_y, image_width, image_height);
        
        let current_outer_x = proj_curr_outer.x;
        let current_outer_y = proj_curr_outer.y;
        let current_inner_x = proj_curr_inner.x;
        let current_inner_y = proj_curr_inner.y;
        
        // Calculate center point of the current day's trapezoidal segment
        let center_x = (current_outer_x + current_inner_x + prev_inner_x + prev_outer_x) / 4;
        let center_y = (current_outer_y + current_inner_y + prev_inner_y + prev_outer_y) / 4;

        // Text Rotation Angle (using turn_outer_prev and turn_outer_curr)
        const avg_outer_turn = (turn_outer_prev + turn_outer_curr) / 2;
        const theta_for_text = avg_outer_turn * 2 * Math.PI;
        let left_to_right_text_rotation_angle = -((theta_for_text / (2 * Math.PI)) % 1) * 360;
        let bottom_to_top_text_rotation_angle = left_to_right_text_rotation_angle + 90;

        let adjusted_weekday_index = (current_date.getDay() + 6) % 7; 
        let month_index = current_date.getMonth(); 

        let fill_color_rgb = [
            Math.floor((weekday_colors[adjusted_weekday_index][0] + month_colors[month_index][0]) / 2),
            Math.floor((weekday_colors[adjusted_weekday_index][1] + month_colors[month_index][1]) / 2),
            Math.floor((weekday_colors[adjusted_weekday_index][2] + month_colors[month_index][2]) / 2)
        ];
        
        const date_val = current_date.getDate(); // Use .getDate() for day of the month

        // Special Day Highlight & Marker (check month and day, year is for anniversary calculation)
        if (date_val === special_day.getDate() && current_date.getMonth() === special_day.getMonth()) {
            fill_color_rgb = [255, 255, 0]; // Yellow for special day path segment
            special_day_markers.push({ 
                x: center_x, y: center_y, 
                text: String(current_date.getFullYear() - parameters.special_day_year), 
                rotation: left_to_right_text_rotation_angle, 
                fontSize: 4, color: [0,0,0] 
            });
        }
        
        const fill_color_hex = format_color_string(fill_color_rgb);

        // Draw path and markers for every day segment (Removed "if (i > 0)" condition - Subtask Item 6)
        svg_elements_parts.push(`<path style="fill:${fill_color_hex};stroke:#000000;stroke-width:0.5px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="M ${current_outer_x},${current_outer_y} L ${current_inner_x},${current_inner_y} L ${prev_inner_x},${prev_inner_y} L ${prev_outer_x},${prev_outer_y} Z" />`);
    
        // Day Marker Lines
        if (date_val === 1) {
                day_marker_lines.push({ x1: prev_outer_x, y1: prev_outer_y, x2: prev_inner_x, y2: prev_inner_y, color: [200,0,0], strokeWidth: 2 });
            } else if (date_val % 10 === 1) {
                day_marker_lines.push({ x1: prev_outer_x, y1: prev_outer_y, x2: prev_inner_x, y2: prev_inner_y, color: [0,0,200], strokeWidth: 1.5 });
            } else if (date_val % 5 === 1) {
                day_marker_lines.push({ x1: prev_outer_x, y1: prev_outer_y, x2: prev_inner_x, y2: prev_inner_y, color: [0,200,0], strokeWidth: 1.4 });
            }

            // Text Elements
            if (date_val % 10 === 0 && date_val > 9) { // day 10, 20, 30
                 text_elements.push({ x: center_x, y: center_y, text: String(date_val), rotation: bottom_to_top_text_rotation_angle, fontSize: 4, color: [0,0,200] });
            } else if (date_val % 5 === 0 && date_val > 9) { // day 15, 25 (but not 10,20,30)
                 text_elements.push({ x: center_x, y: center_y, text: String(date_val), rotation: bottom_to_top_text_rotation_angle, fontSize: 4, color: [0,100,0] });
            }

            if (date_val >= 1 && date_val <= 3) { // 1st, 2nd, 3rd day of month
                const month_char = current_month_names[month_index][date_val - 1];
                if (month_char) { // Ensure character exists
                    text_elements.push({ x: center_x, y: center_y, text: month_char, rotation: left_to_right_text_rotation_angle, fontSize: 6, color: [0,0,0] });
                }
            }
            
            if (date_val >= 5 && date_val <= 8) { // days 5-8 for year digits
                const year_char_index = date_val - 5;
                const year_str = String(current_date.getFullYear());
                if (year_char_index < year_str.length) {
                    text_elements.push({ x: center_x, y: center_y, text: year_str[year_char_index], rotation: left_to_right_text_rotation_angle, fontSize: 7, color: [0,0,0] });
                }
            }
        // The closing brace for the removed "if (i > 0)" is now correctly removed by not including it here.

        // Update prev_... coordinates for the next iteration (Subtask Item 6)
        prev_outer_x = current_outer_x;
        prev_outer_y = current_outer_y;
        prev_inner_x = current_inner_x;
        prev_inner_y = current_inner_y;
        turn_outer_prev = turn_outer_curr; // Update for the next iteration's text angle

        // Increment current_date for the next day
        current_date.setDate(current_date.getDate() + 1);
    }

    // Process day_marker_lines
    day_marker_lines.forEach(line => {
        svg_elements_parts.push(`<line style="stroke:${format_color_string(line.color)};stroke-width:${line.strokeWidth}px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" />`);
    });

    // Process text_elements
    text_elements.forEach(text => {
        svg_elements_parts.push(`<text transform="translate(${text.x}, ${text.y}) rotate(${text.rotation})" font-family="sans-serif" font-size="${text.fontSize}px" fill="${format_color_string(text.color)}" text-anchor="middle" dominant-baseline="central">${text.text}</text>`);
    });

    // Process special_day_markers
    special_day_markers.forEach(marker => {
        svg_elements_parts.push(`<text transform="translate(${marker.x}, ${marker.y}) rotate(${marker.rotation})" font-family="sans-serif" font-size="${marker.fontSize}px" fill="${format_color_string(marker.color)}" text-anchor="middle" dominant-baseline="central">${marker.text}</text>`);
    });

    svg_elements_parts.push("</svg>");
    return svg_elements_parts.join('');
}

// Get references to DOM elements
const imageWidthInput = document.getElementById('imageWidth');
const imageHeightInput = document.getElementById('imageHeight');
const imageUnitInput = document.getElementById('imageUnit');
const startDateInput = document.getElementById('startDate');
const totalDaysInput = document.getElementById('totalDays');
const rotationConstantInput = document.getElementById('rotationConstant');
const languageInput = document.getElementById('language');
const specialDateInput = document.getElementById('specialDate');
const backgroundColorInput = document.getElementById('backgroundColor');
const outputFileNameInput = document.getElementById('outputFileName'); 
const emptyTurnsInMiddleInput = document.getElementById('emptyTurnsInMiddle');
const additionalTurnsBeyondBorderInput = document.getElementById('additionalTurnsBeyondBorder');
const svgContainer = document.getElementById('svgContainer');
const downloadLink = document.getElementById('downloadLink');
const calendarForm = document.getElementById('calendarForm'); // Added for easy access to form inputs

// New UI elements
const parametersFlap = document.getElementById('parametersFlap');
const toggleParametersButton = document.getElementById('toggleParametersButton');
const zoomInButton = document.getElementById('zoomInButton');
const zoomOutButton = document.getElementById('zoomOutButton');
const zoomableScrollableContainer = document.getElementById('zoomableScrollableContainer');
const errorMessageContainer = document.getElementById('errorMessageContainer');
const calendarBackground = document.getElementById('calendarBackground');

// Function to apply zoom
function applyZoom() {
    const baseSvgWidth = parseInt(imageWidthInput.value, 10);
    const baseSvgHeight = parseInt(imageHeightInput.value, 10);

    if (isNaN(baseSvgWidth) || isNaN(baseSvgHeight) || baseSvgWidth <= 0 || baseSvgHeight <= 0) {
        console.error("Invalid base SVG dimensions for zoom.");
        return;
    }

    const newWidth = baseSvgWidth * currentZoom;
    const newHeight = baseSvgHeight * currentZoom;

    zoomableScrollableContainer.style.width = newWidth + 'px';
    zoomableScrollableContainer.style.height = newHeight + 'px';

    const svgElement = svgContainer.querySelector('svg');
    if (svgElement) {
        // svgElement.style.transformOrigin = 'top left'; // Already set in CSS
        svgElement.style.transform = `scale(${currentZoom})`;
        // The SVG element's width/height attributes are set by createCalendar to base dimensions
    }
}

// Function to generate and display the calendar
function generateAndDisplayCalendar() {
    try {
        // Clear previous errors
        errorMessageContainer.innerHTML = '';
        errorMessageContainer.style.display = 'none';

        // Read parameter values
        const imageWidth = parseInt(imageWidthInput.value, 10);
        const imageHeight = parseInt(imageHeightInput.value, 10);
        const imageUnit = imageUnitInput.value;
        const startDateValue = startDateInput.value; // e.g., "2000-01-01"
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
        const totalDays = parseInt(totalDaysInput.value, 10);
        const rotationConstant = parseFloat(rotationConstantInput.value); // Verified: Already parseFloat
        const language = languageInput.value;
        const specialDateValue = specialDateInput.value; // e.g., "2000-01-01"
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
        const backgroundColor = backgroundColorInput.value || '#000000'; // Default to black if empty
        const emptyTurnsInMiddle = parseFloat(emptyTurnsInMiddleInput.value); // Changed to parseFloat
        const additionalTurnsBeyondBorder = parseFloat(additionalTurnsBeyondBorderInput.value); // Changed to parseFloat
        
        let filename = outputFileNameInput.value;
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

        const svgString = createCalendar(calendarParameters);
        
        svgContainer.innerHTML = svgString;
        const svgElement = svgContainer.querySelector('svg');
        if (svgElement) {
            svgElement.style.userSelect = 'none';
            svgElement.style.webkitUserSelect = 'none'; // Safari
            svgElement.style.mozUserSelect = 'none';    // Firefox
            svgElement.style.msUserSelect = 'none';     // IE/Edge
        }

        // Reset pan on new calendar generation (REMOVED)
        // Apply current zoom and reset pan (REMOVED)
        applyZoom(); // Apply zoom after new SVG is rendered and sized

        // console.log("Generated SVG String length:", svgString.length); // Keep for debugging

        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
        }

        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        currentObjectUrl = url; 

        downloadLink.href = url;
        downloadLink.download = filename; 
        downloadLink.style.display = 'block';
        downloadLink.textContent = `Download ${filename}`;

        // Update calendar background color if #calendarBackground is used for it
        if (calendarBackground) {
            // This assumes the SVG's own background rect is what shows the color.
            // If #calendarBackground itself needs to change color (e.g., for areas outside SVG), do:
            // calendarBackground.style.backgroundColor = backgroundColor;
        }

    } catch (error) {
        console.error("Error generating calendar:", error);
        errorMessageContainer.innerHTML = `<p>Error generating calendar: ${error.message}</p>`;
        errorMessageContainer.style.display = 'block';
        svgContainer.innerHTML = ''; // Clear SVG container on error
        downloadLink.style.display = 'none'; // Hide download link on error
    }
}

// Event listener for toggling parameters flap
toggleParametersButton.addEventListener('click', () => {
    parametersFlap.classList.toggle('hidden');
    if (parametersFlap.classList.contains('hidden')) {
        toggleParametersButton.textContent = 'Show Parameters';
    } else {
        toggleParametersButton.textContent = 'Hide Parameters';
    }
});

// Add event listeners to form inputs for automatic regeneration
const formInputs = calendarForm.querySelectorAll('input, select');
formInputs.forEach(input => {
    input.addEventListener('input', () => { // 'input' for text/number, works for select too
        // For select, 'change' is more traditional but 'input' often works
        // Debounce or throttle this if performance becomes an issue with rapid changes
        generateAndDisplayCalendar();
    });
});

// Initial calendar generation on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set initial button text based on flap visibility (assuming it's visible by default)
    if (parametersFlap.classList.contains('hidden')) {
        toggleParametersButton.textContent = 'Show Parameters';
    } else {
        toggleParametersButton.textContent = 'Hide Parameters';
    }
    // Inside DOMContentLoaded
    if (startDateInput) { // Ensure the element exists
        // Set a default start date if not already set by the browser or user
        // The original separate inputs defaulted to 2000-01-01
        if (!startDateInput.value) {
             startDateInput.value = "2000-01-01";
        }
    }
    if (specialDateInput) { // Ensure the element exists
        // Set a default special date if not already set
        // The original separate inputs defaulted to 2000-01-01
        if (!specialDateInput.value) {
            specialDateInput.value = "2000-01-01";
        }
    }
    generateAndDisplayCalendar(); // This will call applyZoom internally
    // calendarBackground.style.cursor = 'grab'; // REMOVED: No longer needed for JS panning
});

// Zoom functionality
zoomInButton.addEventListener('click', () => {
    currentZoom += zoomStep;
    applyZoom();
});

zoomOutButton.addEventListener('click', () => {
    currentZoom = Math.max(0.1, currentZoom - zoomStep); // Prevent zoom from becoming too small
    applyZoom();
});

// Pan functionality (REMOVED - native scroll is used)

// Drag-to-scroll functionality
let isDragging = false;
let initialClientX = 0;
let initialClientY = 0;
let initialScrollLeft = 0;
let initialScrollTop = 0;

if (zoomableScrollableContainer && calendarBackground) {
    zoomableScrollableContainer.addEventListener('mousedown', (event) => {
        isDragging = true;
        initialClientX = event.clientX;
        initialClientY = event.clientY;
        initialScrollLeft = calendarBackground.scrollLeft;
        initialScrollTop = calendarBackground.scrollTop;
        calendarBackground.style.cursor = 'grabbing'; // Target calendarBackground for cursor
        event.preventDefault(); // Prevent text selection, etc.
    });

    // Attach mousemove to document for smoother dragging even if cursor leaves the container
    document.addEventListener('mousemove', (event) => {
        if (!isDragging) return;
        event.preventDefault(); // Prevent text selection during drag

        const deltaX = event.clientX - initialClientX;
        const deltaY = event.clientY - initialClientY;

        // Adjust scroll based on delta. Sensitivity is 1:1 with mouse movement.
        calendarBackground.scrollLeft = initialScrollLeft - deltaX;
        calendarBackground.scrollTop = initialScrollTop - deltaY;
    });

    // Attach mouseup to document to catch mouse release anywhere
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            if (calendarBackground) { // Ensure calendarBackground exists
                calendarBackground.style.cursor = 'grab'; // Target calendarBackground for cursor
            }
        }
    });

    // Handle mouse leaving the container while dragging
    zoomableScrollableContainer.addEventListener('mouseleave', () => {
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
    if (calendarBackground) { // Ensure calendarBackground exists
        calendarBackground.style.cursor = 'grab';
    }

} else {
    console.error("zoomableScrollableContainer or calendarBackground not found. Drag-to-scroll will not work.");
}


// The old generateButton and its listener are removed as the button itself is gone from HTML.

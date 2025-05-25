import './style.css'; // Import CSS for styling

let currentObjectUrl = null; // For revoking previous object URLs

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

    const image_width = parameters.image_width;
    const image_height = parameters.image_height;

    let svg_elements_parts = [];
    svg_elements_parts.push(`<svg width="${image_width}${parameters.image_unit}" height="${image_height}${parameters.image_unit}" viewBox="${-image_width/2} ${-image_height/2} ${image_width} ${image_height}" xmlns="http://www.w3.org/2000/svg" version="1.1" baseProfile="full">`);
    svg_elements_parts.push(`<rect x="${-image_width/2}" y="${-image_height/2}" width="${image_width}" height="${image_height}" fill="${parameters.background_color}" />`);


    let prev_outer_x = 0;
    let prev_outer_y = 0;
    let prev_inner_x = 0;
    let prev_inner_y = 0;
    let angle = 0;
    let spiral_progress = 0;
    let radius_factor = 0;
    const spiral_progress_increment = 1 / parameters.total_days;
    const angle_increment = (2 * Math.PI) / parameters.rotation_constant * 0.85; 

    let current_date = new Date(parameters.start_year, parameters.start_month - 1, parameters.start_day);
    const special_day = new Date(parameters.special_day_year, parameters.special_day_month - 1, parameters.special_day_day);

    let special_day_markers = [];
    let text_elements = []; 
    let day_marker_lines = []; 

    for (let i = 0; i < parameters.total_days + 800; i++) {
        let current_outer_x_raw = Math.sin(angle) * radius_factor;
        let current_outer_y_raw = Math.cos(angle) * radius_factor;
        let current_inner_x_raw = Math.sin(angle) * (radius_factor + angle_increment); 
        let current_inner_y_raw = Math.cos(angle) * (radius_factor + angle_increment);

        let proj_outer = project_point_within_circle_to_rectangle(current_outer_x_raw, current_outer_y_raw, image_width * 0.99, image_height * 0.99);
        let proj_inner = project_point_within_circle_to_rectangle(current_inner_x_raw, current_inner_y_raw, image_width * 0.99, image_height * 0.99);
        
        let current_outer_x = proj_outer.x;
        let current_outer_y = proj_outer.y;
        let current_inner_x = proj_inner.x;
        let current_inner_y = proj_inner.y;

        let center_x = (current_outer_x + current_inner_x + prev_inner_x + prev_outer_x) / 4;
        let center_y = (current_outer_y + current_inner_y + prev_inner_y + prev_outer_y) / 4;

        let left_to_right_text_rotation_angle = -((angle / (2 * Math.PI)) % 1) * 360;
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

        if (i > 0) { 
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
        }


        prev_outer_x = current_outer_x;
        prev_outer_y = current_outer_y;
        prev_inner_x = current_inner_x;
        prev_inner_y = current_inner_y;

        spiral_progress += spiral_progress_increment;
        radius_factor = Math.sqrt(spiral_progress);
        angle = radius_factor * parameters.rotation_constant;

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
const startYearInput = document.getElementById('startYear');
const startMonthInput = document.getElementById('startMonth');
const startDayInput = document.getElementById('startDay');
const totalDaysInput = document.getElementById('totalDays');
const rotationConstantInput = document.getElementById('rotationConstant');
const languageInput = document.getElementById('language');
const specialDayYearInput = document.getElementById('specialDayYear');
const specialDayMonthInput = document.getElementById('specialDayMonth');
const specialDayDayInput = document.getElementById('specialDayDay');
const backgroundColorInput = document.getElementById('backgroundColor');
const outputFileNameInput = document.getElementById('outputFileName'); 
const generateButton = document.getElementById('generateButton');
const svgContainer = document.getElementById('svgContainer');
const downloadLink = document.getElementById('downloadLink');

// Add event listener to the generate button
generateButton.addEventListener('click', () => {
    const imageWidth = parseInt(imageWidthInput.value, 10);
    const imageHeight = parseInt(imageHeightInput.value, 10);
    const imageUnit = imageUnitInput.value;
    const startYear = parseInt(startYearInput.value, 10);
    const startMonth = parseInt(startMonthInput.value, 10);
    const startDay = parseInt(startDayInput.value, 10);
    const totalDays = parseInt(totalDaysInput.value, 10);
    const rotationConstant = parseFloat(rotationConstantInput.value);
    const language = languageInput.value;
    const specialDayYear = parseInt(specialDayYearInput.value, 10);
    const specialDayMonth = parseInt(specialDayMonthInput.value, 10);
    const background_color = backgroundColorInput.value || '#FFFFFF';
    const specialDayDay = parseInt(specialDayDayInput.value, 10);
    
    let filename = outputFileNameInput.value;
    if (!filename || filename.trim() === "") {
        filename = "calendar.svg";
    }
    if (!filename.toLowerCase().endsWith('.svg')) {
        filename += '.svg';
    }

    const calendarParameters = {
        image_width: imageWidth,
        image_height: imageHeight,
        image_unit: imageUnit,
        start_year: startYear,
        start_month: startMonth,
        start_day: startDay,
        total_days: totalDays,
        rotation_constant: rotationConstant,
        language: language,
        special_day_year: specialDayYear,
        special_day_month: specialDayMonth,
        special_day_day: specialDayDay,
        background_color: background_color,
        output_file: filename, 
    };

    console.log("Calendar Parameters:", calendarParameters);

    const svgString = createCalendar(calendarParameters);
    
    svgContainer.innerHTML = svgString;
    console.log("Generated SVG String length:", svgString.length);

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
});

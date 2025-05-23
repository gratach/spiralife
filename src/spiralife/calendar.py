
from math import sin, cos, sqrt, pi
from datetime import datetime, timedelta
from PIL import Image
from pathlib import Path

def create_calendar(parameters):
    """
    Create a spiralife calendar SVG image.

    This function generates a calendar in a spiral shape and saves it as an SVG file.
    The calendar visualizes a range of days, highlighting weekdays, months, and special dates.

    Args:
        parameters (dict): A dictionary containing parameters for calendar generation.
            Expected keys:
            "image_height" (int, optional): Height of the SVG image. Defaults to 1500.
            "image_width" (int, optional): Width of the SVG image. Defaults to 2000.
            "image_unit" (str, optional): Unit for image dimensions (e.g., "px"). Defaults to "px".
            "start_year" (int, optional): Year for the calendar to start. Defaults to 2000.
            "start_month" (int, optional): Month for the calendar to start. Defaults to 1.
            "start_day" (int, optional): Day for the calendar to start. Defaults to 1.
            "input_image" (str, optional): Path to an image to use as background. Defaults to None.
            "special_day_year" (int, optional): Year of a special day to highlight. Defaults to 2000.
            "special_day_month" (int, optional): Month of a special day to highlight. Defaults to 1.
            "special_day_day" (int, optional): Day of a special day to highlight. Defaults to 1.
            "output_file" (str, optional): Name of the output SVG file. Defaults to "calendar.svg".
            "total_days" (int, optional): Total number of days to display in the calendar. Defaults to 36526 (approx. 100 years).
            "rotation_constant" (float, optional): Constant affecting the spiral's rotation tightness. Defaults to 630.
    """
    print(parameters)
    image_height = parameters["image_height"] if "image_height" in parameters else 1500
    image_width = parameters["image_width"] if "image_width" in parameters else 2000
    image_unit = parameters["image_unit"] if "image_unit" in parameters else "px"
    start_year = parameters["start_year"] if "start_year" in parameters else 2000
    start_month = parameters["start_month"] if "start_month" in parameters else 1
    start_day = parameters["start_day"] if "start_day" in parameters else 1
    current_date = datetime(start_year, start_month, start_day)
    input_image_path = parameters["input_image"] if "input_image" in parameters else None
    special_day_year = parameters["special_day_year"] if "special_day_year" in parameters else 2000
    special_day_month = parameters["special_day_month"] if "special_day_month" in parameters else 1
    special_day_day = parameters["special_day_day"] if "special_day_day" in parameters else 1
    special_day = datetime(special_day_year, special_day_month, special_day_day)
    output_file = parameters["output_file"] if "output_file" in parameters else "calendar.svg"
    total_days = parameters["total_days"] if "total_days" in parameters else 36526 # ~ 365.25 * 100
    rotation_constant = parameters["rotation_constant"] if "rotation_constant" in parameters else 630

    def calculate_midpoint(point1_x, point1_y, point2_x, point2_y, factor):
        """
        Calculate a point on the line segment between two points.

        Args:
            point1_x (float): X-coordinate of the first point.
            point1_y (float): Y-coordinate of the first point.
            point2_x (float): X-coordinate of the second point.
            point2_y (float): Y-coordinate of the second point.
            factor (float): A value between 0 and 1 representing the distance
                            from the first point. 0 returns the first point,
                            1 returns the second point.

        Returns:
            tuple: A tuple (x, y) representing the coordinates of the calculated midpoint.
        """
        return (point1_x + (point2_x - point1_x) * factor, point1_y + (point2_y - point1_y) * factor)

    def project_point_to_rectangle_edges(point_x, point_y, rect_width, rect_height):
        """
        Project a point (point_x, point_y) from the origin onto the edges of a rectangle.

        The rectangle is centered at the origin (0,0). If the point is (0,0), it returns (0,0).

        Args:
            point_x (float): X-coordinate of the point to project.
            point_y (float): Y-coordinate of the point to project.
            rect_width (float): Width of the rectangle.
            rect_height (float): Height of the rectangle.

        Returns:
            tuple: A tuple (projected_x, projected_y) representing the coordinates
                   of the point projected onto the rectangle's edges.
        """
        if point_x == 0 and point_y == 0:
            return (0, 0)
        # Half width and half height, as calculations are from the center
        half_rect_width = rect_width / 2
        half_rect_height = rect_height / 2
        
        # Determine if the projection should be based on width or height
        # This depends on which edge the line from origin to point intersects first
        if abs(point_x) / half_rect_width > abs(point_y) / half_rect_height:
            scale_factor = half_rect_width / abs(point_x)
        else:
            scale_factor = half_rect_height / abs(point_y)
            
        projected_x = point_x * scale_factor
        projected_y = point_y * scale_factor
        return (projected_x, projected_y)

    def project_point_within_circle_to_rectangle(point_x, point_y, rect_width, rect_height):
        """
        Projects a point from a unit circle origin onto a target rectangle,
        interpolating between a scaled circular projection and a direct edge projection.

        The function first projects the point onto the edges of the rectangle.
        Then, it calculates a point scaled by the minimum dimension (radius) of the rectangle.
        The final projected point is an interpolation between this scaled circular point
        and the edge-projected point, based on the point's distance from the origin.
        Points closer to the origin are more circular, points closer to the unit circle edge
        are more rectangular.

        Args:
            point_x (float): X-coordinate of the point (assumed to be within a -1 to 1 range).
            point_y (float): Y-coordinate of the point (assumed to be within a -1 to 1 range).
            rect_width (float): Width of the target rectangle.
            rect_height (float): Height of the target rectangle.

        Returns:
            tuple: A tuple (projected_x, projected_y) representing the coordinates
                   of the point projected and interpolated within the rectangle.
        """
        # Project the point directly onto the rectangle's edges
        (projected_edge_x, projected_edge_y) = project_point_to_rectangle_edges(point_x, point_y, rect_width, rect_height)
        
        half_rect_width = rect_width / 2
        half_rect_height = rect_height / 2
        
        # Use the smaller of half_width or half_height as a radius for circular scaling
        min_dimension_radius = min(half_rect_height, half_rect_width)
        
        # Calculate the distance of the original point from the origin
        distance_from_origin = sqrt(point_x*point_x + point_y*point_y)
        
        # Scale the original point by the minimum dimension radius (circular projection part)
        scaled_circular_x = point_x * min_dimension_radius
        scaled_circular_y = point_y * min_dimension_radius
        
        # Interpolate between the scaled circular point and the edge-projected point.
        # The interpolation factor is the distance from the origin, meaning:
        # - if distance_from_origin is 0, the result is (scaled_circular_x, scaled_circular_y)
        # - if distance_from_origin is 1 (edge of unit circle), the result is (projected_edge_x, projected_edge_y)
        return calculate_midpoint(scaled_circular_x, scaled_circular_y, projected_edge_x * distance_from_origin, projected_edge_y * distance_from_origin, distance_from_origin)

    def to_hex_string(value):
        """
        Converts an integer value (0-255) to a two-character hexadecimal string.

        Args:
            value (int): The integer value to convert.

        Returns:
            str: The two-character hexadecimal representation of the value.
        """
        return "%x%x"%(value>>4, value%16)

    def complementary_color(color_rgb):
        """
        Calculates the complementary color for a given RGB color.

        Args:
            color_rgb (tuple): A tuple of three integers (R, G, B) representing the color.

        Returns:
            tuple: A tuple of three integers (R, G, B) representing the complementary color.
        """
        return ((color_rgb[0] + 128)%256,(color_rgb[1] + 128)%256,(color_rgb[2] + 128)%256)

    def format_color_string(color_rgb):
        """
        Formats an RGB color tuple into a six-character hexadecimal color string (e.g., "RRGGBB").

        Args:
            color_rgb (tuple): A tuple of three integers (R, G, B) representing the color.

        Returns:
            str: The hexadecimal color string.
        """
        return to_hex_string(color_rgb[0]) + to_hex_string(color_rgb[1]) + to_hex_string(color_rgb[2])

    input_image_object = Image.open(input_image_path) if input_image_path else None
    if input_image_object:
        input_image_width_minus_one = input_image_object.width - 1
        input_image_height_minus_one = input_image_object.height - 1
        def get_image_pixel_color(point_coordinates):
            """
            Gets the color of a pixel from the input image at normalized coordinates.

            Args:
                point_coordinates (tuple): A tuple (x, y) of coordinates normalized
                                           to the image dimensions (-image_width/2 to +image_width/2,
                                           -image_height/2 to +image_height/2).

            Returns:
                tuple: An RGB tuple representing the color of the pixel, or None if no image.
            """
            # Normalize coordinates from SVG space to image pixel space (0-1 range)
            norm_x = (point_coordinates[0] / image_width + 0.5)
            norm_y = (point_coordinates[1] / image_height + 0.5)
            
            # Clamp normalized coordinates to be within [0, 1]
            norm_x = norm_x if norm_x < 1 else 1
            norm_x = norm_x if norm_x > 0 else 0
            norm_y = norm_y if norm_y < 1 else 1
            norm_y = norm_y if norm_y > 0 else 0
            
            return input_image_object.getpixel((norm_x * input_image_width_minus_one, norm_y * input_image_height_minus_one))

    def add_color_values(val1, val2):
        """
        Adds two color channel values, clamping the result between 0 and 255.

        Args:
            val1 (int): The first color channel value.
            val2 (int): The second color channel value.

        Returns:
            int: The sum of the values, clamped to the range [0, 255].
        """
        result = val1 + val2
        return  0 if result < 0 else( 255 if result > 255 else result)

    def add_colors(color1_rgb, color2_rgb):
        """
        Adds two RGB colors component-wise.

        Args:
            color1_rgb (list or tuple): The first RGB color (3 values).
            color2_rgb (list or tuple): The second RGB color (3 values).

        Returns:
            list: A list containing the resulting RGB color.
        """
        return [add_color_values(color1_rgb[i], color2_rgb[i]) for i in range(3)]
        
        
    # Initialize SVG string with header and viewbox settings
    svg_string = """<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <svg
    viewBox="{x} {y} {width} {height}"
    height="{height}{unit}"
    width="{width}{unit}"
    xmlns="http://www.w3.org/2000/svg"
        version="1.1" baseProfile="full"
    >
    """.format(x = -image_width/2, y = -image_height/2, height = image_height, width = image_width, unit = image_unit)

    svg_string += """\
    """
    # Initialize spiral generation variables
    # prev_outer_x, prev_outer_y: Coordinates of the previous point on the outer edge of the spiral segment
    # prev_inner_x, prev_inner_y: Coordinates of the previous point on the inner edge of the spiral segment
    prev_outer_x = 0
    prev_outer_y = 0
    prev_inner_x = 0
    prev_inner_y = 0
    angle = 0  # Current angle in the spiral
    spiral_progress = 0 # Normalized progress along the total length of the spiral (0 to 1)
    radius_factor = 0 # Factor that determines the current radius of the spiral
    spiral_progress_increment = 1 / total_days # How much spiral_progress increases per day
    angle_increment = 2 * pi / rotation_constant * 0.85 # Angle increment per day, defines spiral tightness

    # Color definitions
    weekday_colors = [[255, 255, 255],[255, 255, 255],[255, 255, 255],[255, 255, 255],[255, 255, 255],[130, 255, 100],[255, 100, 15]] # Colors for days of the week
    month_names = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"] # German month abbreviations for display
    month_colors = [[2, 100, 255],[44, 120, 210],[33, 180, 100],[100, 240, 120],[230, 222, 90],[255, 140, 0],[255, 0, 0],[190, 180, 0],[200, 180, 100],[190, 210, 100],[150, 150, 150],[70, 90, 120]] # Colors for months
    
    one_day_delta = timedelta(1) # Timedelta for one day, used to increment current_date
    
    # Lists to store SVG elements
    special_day_markers = [] # Stores data for highlighting special days (e.g., birthdays)
    text_elements = [] # Stores data for text elements (day numbers, month names, year)
    day_marker_lines = [] # Stores data for lines that mark certain days (e.g., start of month)

    # Main loop to generate calendar days
    # Iterate a bit beyond total_days to ensure spiral segments are complete
    for i in range(total_days + 800):
        # Calculate coordinates for the current segment of the spiral
        # current_outer_x, current_outer_y: Point on the outer edge of the current spiral segment
        # current_inner_x, current_inner_y: Point on the inner edge of the current spiral segment
        current_outer_x = sin(angle) * radius_factor
        current_outer_y = cos(angle) * radius_factor
        current_inner_x = sin(angle) * (radius_factor + angle_increment) # Inner point is slightly ahead angularly
        current_inner_y = cos(angle) * (radius_factor + angle_increment)
        
        # Project these circular spiral points to fit within the rectangular image bounds
        # The quadmach function distorts the spiral to fill the rectangle
        (current_outer_x, current_outer_y) = project_point_within_circle_to_rectangle(current_outer_x, current_outer_y, image_width * 0.99, image_height * 0.99)
        (current_inner_x, current_inner_y) = project_point_within_circle_to_rectangle(current_inner_x, current_inner_y, image_width * 0.99, image_height * 0.99)
        
        # Calculate the center point of the current day's trapezoidal segment
        center_x = (current_outer_x + current_inner_x + prev_outer_x + prev_inner_x) / 4
        center_y = (current_outer_y + current_inner_y + prev_outer_y + prev_inner_y) / 4
        
        weekday_index = current_date.weekday() # 0 for Monday, 6 for Sunday
        month_index = current_date.month - 1 # 0 for January, 11 for December
        
        # Determine fill color for the day segment
        # It's an average of the weekday color and the month color
        fill_color = [(weekday_colors[weekday_index][j] + month_colors[month_index][j]) // 2 for j in range(3)]
        
        # If an input image is provided, blend its color with the calculated fill_color
        # (Currently commented out)
        #if input_image_object:
        #    background_pixel_color = get_image_pixel_color((center_x, center_y))
        #    fill_color = add_colors(fill_color, background_pixel_color)

        # Add visual markers for specific days
        if current_date.day == 1: # First day of the month
            day_marker_lines.append((prev_outer_x, prev_outer_y, prev_inner_x, prev_inner_y, (200,0,0), 2)) # Red line
        elif current_date.day % 10 == 1: # Days ending in 1 (1st, 11th, 21st, 31st)
            day_marker_lines.append((prev_outer_x, prev_outer_y, prev_inner_x, prev_inner_y, (0,0,200), 1.5)) # Blue line
        elif current_date.day % 5 == 1: # Days ending in 1 or 6 (1st, 6th, 11th, 16th, 21st, 26th, 31st)
            day_marker_lines.append((prev_outer_x, prev_outer_y, prev_inner_x, prev_inner_y, (0,200,0), 1.4)) # Green line
        
        # Add text elements for day numbers
        left_to_right_text_rotation_angle = -(angle / (2*pi))% 1 * 360 # Calculate text rotation for continuous text
        bottom_to_top_text_rotation_angle = left_to_right_text_rotation_angle + 90 # Rotate text to be upright
        if current_date.day % 10 == 0: # Days that are multiples of 10
            if current_date.day > 9: # Avoid marking day 0 if logic changes
                text_elements.append((center_x, center_y, current_date.day, bottom_to_top_text_rotation_angle, 4, [0,0,200])) # Blue text
        elif current_date.day % 5 == 0: # Days that are multiples of 5 (but not 10)
            if current_date.day > 9: # Avoid marking day 0 or 5 if logic changes
                text_elements.append((center_x, center_y, current_date.day, bottom_to_top_text_rotation_angle, 4, [0,100,0])) # Greenish text

        # Add text elements for the first three letters of the month name on the first three days of the month
        if current_date.day < 4: # 1st, 2nd, 3rd day of the month
            text_elements.append((center_x, center_y, month_names[current_date.month - 1][current_date.day - 1], left_to_right_text_rotation_angle, 6, [0,0,0])) # Black text
        
        # Add text elements for year digits on days 5 through 8 of a month
        if current_date.day in range(5, 9): # 5th, 6th, 7th, 8th day of the month
            year_char_index = current_date.day - 5
            text_elements.append((center_x, center_y, str(current_date.year)[year_char_index], left_to_right_text_rotation_angle, 7, [0,0,0])) # Black text

        # Highlight special days (e.g., birthdays)
        if current_date.day == special_day.day and current_date.month == special_day.month:
            fill_color = [255,255,0] # Yellow fill for special day
            # Add a text marker for the anniversary year of the special day
            special_day_markers.append((center_x, center_y, current_date.year - special_day_year, left_to_right_text_rotation_angle, [0,0,0]))
        
        # Construct the SVG path element for the current day's segment
        # This is a trapezoid defined by the previous and current inner/outer spiral points
        svg_string += '<path style="fill:#%s%s%s;stroke:#000000;stroke-width:0.5px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"'%(to_hex_string(fill_color[0]), to_hex_string(fill_color[1]), to_hex_string(fill_color[2]))
        svg_string += ' d = "M %s,%s L %s,%s %s,%s %s,%s Z '%(current_outer_x,current_outer_y, current_inner_x,current_inner_y, prev_inner_x,prev_inner_y, prev_outer_x,prev_outer_y)
        svg_string += '"/>'
        
        # Update previous points for the next iteration
        prev_outer_x = current_outer_x
        prev_outer_y = current_outer_y
        prev_inner_x = current_inner_x
        prev_inner_y = current_inner_y
        
        # Increment progress variables for the spiral
        spiral_progress += spiral_progress_increment
        radius_factor = sqrt(spiral_progress) # Radius grows with square root of progress, making spiral denser at center
        angle = radius_factor * rotation_constant # Angle increases with radius_factor
        
        current_date += one_day_delta # Move to the next day
        
    # Add day marker lines to the SVG
    # These lines are drawn on top of the day segments
    for marker_data in day_marker_lines:
        svg_string += '''<line style="stroke:#%s;stroke-width:%s;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" x1="%s" y1="%s" x2="%s" y2="%s" />'''%(format_color_string(marker_data[4]), marker_data[5], marker_data[0],marker_data[1],marker_data[2],marker_data[3])
    
    # Add text elements (day numbers, month names, years) to the SVG
    for text_data in text_elements:
        svg_string += """<text fill="#%s" text-anchor="middle" dominant-baseline="central" font-size="%s" transform=" translate(%s, %s) rotate(%s)">%s</text>"""%(format_color_string(text_data[5]), text_data[4], text_data[0],text_data[1], text_data[3],text_data[2])
    
    # Add markers for special days (e.g., birthday year numbers) to the SVG
    for marker_data in special_day_markers:
        svg_string += """<text fill="#%s" text-anchor="middle" dominant-baseline="central" font-size="4px" transform=" translate(%s, %s) rotate(%s)">%s</text>"""%(format_color_string(marker_data[4]), marker_data[0],marker_data[1], marker_data[3],marker_data[2])
    
    # Close the SVG root element
    svg_string += """
    </svg>
    """

    # Write the complete SVG string to the output file
    with open(output_file, "w") as f:
        f.write(svg_string)
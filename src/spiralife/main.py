
from .calendar import create_calendar
from sys import argv
from getopt import getopt

# Help string detailing command-line usage and options
helpstring = """
This script creates a spiral calendar
Usage: spiralife [OPTIONS]
Options:
    -o, --output_file=FILE       The output file name. Default: calendar.svg
    -h, --height=INT             The height of the image. Default: 1500
    -w, --width=INT              The width of the image. Default: 2000
    -u, --unit=STRING            The unit of the image. Default: px
    -i, --input_image=FILE       The input image file. Default: None
    -y, --start_year=INT         The start year of the calendar. Default: 2000
    -m, --start_month=INT        The start month of the calendar. Default: 1
    -d, --start_day=INT          The start day of the calendar. Default: 1
    -t, --total_days=INT         The total number of days in the calendar. Default: 36526
    -r, --rotation_constant=INT  The rotation constant of the spiral. Default: 630
        --special_day_year=INT   The year of the special day. Default: 2000
        --special_day_month=INT  The month of the special day. Default: 1
        --special_day_day=INT    The day of the special day. Default: 1
        --help                   Show this help message
"""

def main(*args):
    """
    Main function to parse command-line arguments and generate the spiral calendar.

    The function can accept arguments directly as a dictionary (primarily for testing or programmatic use)
    or parse them from sys.argv using getopt.
    """
    calendar_parameters = {} # Dictionary to hold parameters for the create_calendar function

    # Check if arguments are passed directly as a dictionary
    if len(args) != 0 and isinstance(args[0], dict):
        calendar_parameters = args[0]
    else:
        # Parse command-line arguments using getopt
        # Short options are single characters preceded by '-', long options are words preceded by '--'
        # Options requiring an argument are followed by ':' (e.g., "o:")
        try:
            options_list, remaining_args = getopt(argv[1:], "o:h:w:u:i:y:m:d:t:r:", [ 
                "output_file=", 
                "height=",
                "width=",
                "unit=",
                "input_image=",
                "start_year=",
                "start_month=",
                "start_day=",
                "total_days=",
                "rotation_constant=",
                "special_day_year=",
                "special_day_month=",
                "special_day_day=",
                "help"
                ])
        except getopt.GetoptError as err:
            # Print error message and help string if argument parsing fails
            print(err) 
            print(helpstring)
            return

        # Convert the list of (option, value) tuples from getopt into a dictionary
        options_dictionary = dict(options_list)

        # If "--help" is requested or no arguments are provided, print help and exit
        if "--help" in options_dictionary or len(argv) == 1:
            print(helpstring)
            return

        # Populate calendar_parameters from the parsed options_dictionary
        # Uses .get() with defaults for both long and short option forms, and then a final default value
        calendar_parameters = {
            "output_file": options_dictionary.get("--output_file", options_dictionary.get("-o", "calendar.svg")),
            "image_height": int(options_dictionary.get("--height", options_dictionary.get("-h", 1500))),
            "image_width": int(options_dictionary.get("--width", options_dictionary.get("-w", 2000))),
            "image_unit": options_dictionary.get("--unit", options_dictionary.get("-u", "px")),
            "input_image": options_dictionary.get("--input_image", options_dictionary.get("-i", None)),
            "start_year": int(options_dictionary.get("--start_year", options_dictionary.get("-y", 2000))),
            "start_month": int(options_dictionary.get("--start_month", options_dictionary.get("-m", 1))),
            "start_day": int(options_dictionary.get("--start_day", options_dictionary.get("-d", 1))),
            "total_days": int(options_dictionary.get("--total_days", options_dictionary.get("-t", 36526))),
            "rotation_constant": int(options_dictionary.get("--rotation_constant", options_dictionary.get("-r", 630))),
            "special_day_year": int(options_dictionary.get("--special_day_year", 2000)),
            "special_day_month": int(options_dictionary.get("--special_day_month", 1)),
            "special_day_day": int(options_dictionary.get("--special_day_day", 1)),
        }
        
    # Call the function to create the calendar with the determined parameters
    create_calendar(calendar_parameters)
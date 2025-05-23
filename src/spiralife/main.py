
from .calendar import create_calendar
from sys import argv
from getopt import getopt
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
    calendar_args = {}
    if len(args) != 0 and isinstance(args[0], dict):
        calendar_args = args[0]
    else:
        optlist, args = getopt(argv[1:], "o:h:w:u:i:y:m:d:t:r:", [ 
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
        optdict = dict(optlist)
        if "--help" in optdict or len(argv) == 1:
            print(helpstring)
            return
        calendar_args = {
            "output_file": optdict.get("--output_file", optdict.get("-o", "calendar.svg")),
            "image_height": int(optdict.get("--height", optdict.get("-h", 1500))),
            "image_width": int(optdict.get("--width", optdict.get("-w", 2000))),
            "image_unit": optdict.get("--unit", optdict.get("-u", "px")),
            "input_image": optdict.get("--input_image", optdict.get("-i", None)),
            "start_year": int(optdict.get("--start_year", optdict.get("-y", 2000))),
            "start_month": int(optdict.get("--start_month", optdict.get("-m", 1))),
            "start_day": int(optdict.get("--start_day", optdict.get("-d", 1))),
            "total_days": int(optdict.get("--total_days", optdict.get("-t", 36526))),
            "rotation_constant": int(optdict.get("--rotation_constant", optdict.get("-r", 630))),
            "special_day_year": int(optdict.get("--special_day_year", 2000)),
            "special_day_month": int(optdict.get("--special_day_month", 1)),
            "special_day_day": int(optdict.get("--special_day_day", 1)),
        }
        
    create_calendar(calendar_args)
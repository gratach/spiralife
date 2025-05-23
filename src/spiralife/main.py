
from .calendar import create_calendar
def main(*args):
    create_calendar({
        'year': 2020,
        'month': 1,
        'day': 1,
        "output_file": "calendar.svg",
	} if len(args) == 0 else args[0])
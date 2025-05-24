import unittest
import os
import sys

# Add the src directory to the Python path to allow importing spiralife
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from spiralife.calendar import create_calendar, MONTH_NAMES

class TestCalendarLanguage(unittest.TestCase):

    def tearDown(self):
        # Clean up generated SVG files after each test
        files_to_remove = [
            "calendar_en_default.svg",
            "calendar_en_explicit.svg",
            "calendar_de.svg",
            "calendar_fr.svg",
            "calendar_es.svg",
            "calendar_unsupported.svg"
        ]
        for f in files_to_remove:
            if os.path.exists(f):
                os.remove(f)

    def _run_test_for_language(self, language_code, expected_months, output_filename):
        params = {
            "output_file": output_filename,
            "total_days": 35, # Keep SVG small for faster testing
            "start_year": 2024,
            "start_month": 1,
            "start_day": 1,
        }
        if language_code:
            params["language"] = language_code

        create_calendar(params)
        self.assertTrue(os.path.exists(output_filename))

        with open(output_filename, 'r', encoding='utf-8') as f:
            svg_content = f.read()

        # Month names are displayed for the first 3 days of the month.
        # We only check for the first letter of each month name for simplicity,
        # as the full name might be split across elements or have case variations.
        # Example: <text [...]>J</text><text [...]>a</text><text [...]>n</text>
        # We will check for ">X</text>" where X is the first letter of an expected month.
        # This also helps avoid issues if a month name is a substring of another (not an issue with current abbrevs).

        # We need to ensure that at least one day of each month is rendered to check its name.
        # With total_days=35, we will only see January and February.
        # Let's adjust total_days to ensure we see all months for a more robust test.
        # A full year has 366 days max.
        if "total_days" in params and params["total_days"] < 366:
             print(f"Warning: total_days is {params['total_days']}, which might not be enough to display all months for {output_filename}.")
             # For this test, we will focus on the first few months if total_days is small.
             # The create_calendar function itself puts the first letter of the month name
             # for the first day, second letter for second day, third for third day.
             # e.g., for "Jan": day 1 gets "J", day 2 gets "a", day 3 gets "n".
             # So we should check for these specific characters.

        for month_abbr in expected_months:
            # Check for each character of the abbreviation individually,
            # as they are rendered in separate text elements.
            for char_index, char_to_find in enumerate(month_abbr):
                # This check assumes that if the first char of a month is found, the month is likely correct.
                # A more robust check would be to ensure all 3 chars are present for days 1, 2, 3 of each month.
                # However, given the structure, we'll check for the presence of each char of the abbreviation.
                # e.g. for "Jan", check for ">J</text>", ">a</text>", ">n</text>" (potentially near each other)
                # For now, a simpler check:
                self.assertIn(f">{char_to_find}</text>", svg_content,
                              f"Character '{char_to_find}' of month '{month_abbr}' not found in {output_filename} for language '{language_code}'")


    def test_default_english_months(self):
        output_filename = "calendar_en_default.svg"
        # No language parameter, should default to English
        params = {
            "output_file": output_filename,
            "total_days": 366, # Ensure all months can be rendered
            "start_year": 2024, "start_month": 1, "start_day": 1,
        }
        create_calendar(params)
        self.assertTrue(os.path.exists(output_filename))
        with open(output_filename, 'r', encoding='utf-8') as f:
            svg_content = f.read()
        for month_abbr in MONTH_NAMES["en"]:
            for char_to_find in month_abbr:
                self.assertIn(f">{char_to_find}</text>", svg_content,
                              f"Character '{char_to_find}' of English month '{month_abbr}' not found in {output_filename} (default lang)")

    def test_explicit_english_months(self):
        output_filename = "calendar_en_explicit.svg"
        params = {
            "output_file": output_filename, "language": "en",
            "total_days": 366, "start_year": 2024, "start_month": 1, "start_day": 1,
        }
        create_calendar(params)
        self.assertTrue(os.path.exists(output_filename))
        with open(output_filename, 'r', encoding='utf-8') as f:
            svg_content = f.read()
        for month_abbr in MONTH_NAMES["en"]:
            for char_to_find in month_abbr:
                self.assertIn(f">{char_to_find}</text>", svg_content,
                              f"Character '{char_to_find}' of English month '{month_abbr}' not found in {output_filename} (lang='en')")

    def test_german_months(self):
        output_filename = "calendar_de.svg"
        params = {
            "output_file": output_filename, "language": "de",
            "total_days": 366, "start_year": 2024, "start_month": 1, "start_day": 1,
        }
        create_calendar(params)
        self.assertTrue(os.path.exists(output_filename))
        with open(output_filename, 'r', encoding='utf-8') as f:
            svg_content = f.read()
        for month_abbr in MONTH_NAMES["de"]:
            # Special handling for Umlauts if necessary, though SVG should handle UTF-8
            for char_to_find in month_abbr:
                self.assertIn(f">{char_to_find}</text>", svg_content,
                              f"Character '{char_to_find}' of German month '{month_abbr}' not found in {output_filename} (lang='de')")

    def test_french_months(self):
        output_filename = "calendar_fr.svg"
        params = {
            "output_file": output_filename, "language": "fr",
            "total_days": 366, "start_year": 2024, "start_month": 1, "start_day": 1,
        }
        create_calendar(params)
        self.assertTrue(os.path.exists(output_filename))
        with open(output_filename, 'r', encoding='utf-8') as f:
            svg_content = f.read()
        for month_abbr in MONTH_NAMES["fr"]:
            chars_to_check = month_abbr
            if month_abbr == "Juil": # "Juil" is 4 chars, but only first 3 are rendered
                chars_to_check = "Jui"
            for char_to_find in chars_to_check:
                self.assertIn(f">{char_to_find}</text>", svg_content,
                              f"Character '{char_to_find}' of French month '{month_abbr}' (checking for '{chars_to_check}') not found in {output_filename} (lang='fr')")

    def test_spanish_months(self):
        output_filename = "calendar_es.svg"
        params = {
            "output_file": output_filename, "language": "es",
            "total_days": 366, "start_year": 2024, "start_month": 1, "start_day": 1,
        }
        create_calendar(params)
        self.assertTrue(os.path.exists(output_filename))
        with open(output_filename, 'r', encoding='utf-8') as f:
            svg_content = f.read()
        for month_abbr in MONTH_NAMES["es"]:
             chars_to_check = month_abbr
             if month_abbr == "Juil": # "Juil" is 4 chars, but only first 3 are rendered
                 chars_to_check = "Jui"
             for char_to_find in chars_to_check:
                self.assertIn(f">{char_to_find}</text>", svg_content,
                               f"Character '{char_to_find}' of French month '{month_abbr}' (checking for '{chars_to_check}') not found in {output_filename} (lang='fr')")

    def test_unsupported_language_defaults_to_english(self):
        output_filename = "calendar_unsupported.svg"
        params = {
            "output_file": output_filename, "language": "xx", # xx is not a supported language
            "total_days": 366, "start_year": 2024, "start_month": 1, "start_day": 1,
        }
        create_calendar(params)
        self.assertTrue(os.path.exists(output_filename))
        with open(output_filename, 'r', encoding='utf-8') as f:
            svg_content = f.read()
        for month_abbr in MONTH_NAMES["en"]: # Should default to English
            for char_to_find in month_abbr:
                self.assertIn(f">{char_to_find}</text>", svg_content,
                              f"Character '{char_to_find}' of English month '{month_abbr}' not found in {output_filename} (unsupported lang, default to en)")

if __name__ == '__main__':
    unittest.main()

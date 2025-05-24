# Spiralife Calendar Generator - Web Version

## Description

This project generates a visually unique spiral calendar as an SVG image. It is a JavaScript port of an original Python project, designed to run directly in a web browser. The generated calendar visualizes a span of days in a continuous spiral, with customizable colors, date ranges, and highlighting for special occasions.

## How to Use

**Install Dependencies and Build:**
    *   Open a terminal and navigate to the `javascript` directory.
    *   Run the following commands:
         ```bash
         npm install .
         npm run build
         ```
    *   This will install the necessary dependencies and build the project.

2.  **Open the Application:**
    *   Navigate to the `javascript/dist/` directory in your local copy of the repository.
    *   Open the `index.html` file in a modern web browser (e.g., Chrome, Firefox, Safari, Edge).

3.  **Configure Your Calendar:**
    *   You will see a form with various input fields. Adjust these to customize your calendar:
        *   **Image Width/Height:** Dimensions of the output SVG image (e.g., 2000x1500).
        *   **Image Unit:** The unit for width and height (e.g., `px`).
        *   **Start Year/Month/Day:** The starting date for your calendar.
        *   **Total Days:** The total number of days the calendar should represent.
        *   **Rotation Constant:** Affects how tightly the spiral winds.
        *   **Language:** Choose the language for month names (currently supports English, German, French, Spanish).
        *   **Special Day Year/Month/Day:** Define a specific date (e.g., a birthday). The calendar will highlight anniversaries of this date.
        *   **Output File Name:** The name for the SVG file when you download it (e.g., `my_calendar.svg`).

4.  **Generate the Calendar:**
    *   Click the "Generate Calendar" button.
    *   The generated SVG calendar will appear in the preview area on the page.

5.  **Download the SVG:**
    *   Once the calendar is generated, a "Download [filename]" link will appear below the preview.
    *   Click this link to download the generated SVG image to your computer.

## Features

*   **Customizable Date Range:** Specify start date and total number of days.
*   **Adjustable Spiral Parameters:** Control the spiral's appearance with the rotation constant.
*   **Multilingual Month Names:** Support for English, German, French, and Spanish.
*   **Special Day Highlighting:** Anniversaries of a chosen "special day" are highlighted, and the anniversary year is displayed.
*   **SVG Output:** Generates scalable vector graphics, perfect for high-quality printing or web use.
*   **Interactive Preview:** View the calendar directly on the webpage before downloading.

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
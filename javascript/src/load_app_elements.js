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
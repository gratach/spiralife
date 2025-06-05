export function applyZoom(app) {
    const baseSvgWidth = parseInt(app.imageWidthInput.value, 10);
    const baseSvgHeight = parseInt(app.imageHeightInput.value, 10);

    if (isNaN(baseSvgWidth) || isNaN(baseSvgHeight) || baseSvgWidth <= 0 || baseSvgHeight <= 0) {
        console.error("Invalid base SVG dimensions for zoom.");
        return;
    }

    const newWidth = baseSvgWidth * app.currentZoom;
    const newHeight = baseSvgHeight * app.currentZoom;

    app.zoomableScrollableContainer.style.width = newWidth + 'px';
    app.zoomableScrollableContainer.style.height = newHeight + 'px';

    const svgElement = app.svgContainer.querySelector('svg');
    if (svgElement) {
        // svgElement.style.transformOrigin = 'top left'; // Already set in CSS
        svgElement.style.transform = `scale(${app.currentZoom})`;
        // The SVG element's width/height attributes are set by createCalendar to base dimensions
    }
}
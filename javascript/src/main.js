import './style.css'; // Import CSS for styling
import {loadAppElements} from './load_app_elements.js'
import { addEventListeners } from './add_event_listeners.js';

let app = loadAppElements();
app.currentZoom = 1;
app.zoomStep = 0.1; // Or your preferred step
app.currentObjectUrl = null; // For revoking previous object URLs
addEventListeners(app);




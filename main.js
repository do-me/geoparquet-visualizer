// --- DOM Elements ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const urlInput = document.getElementById('url-input');
const loadUrlButton = document.getElementById('load-url-button');
const limitInput = document.getElementById('limit-input');
const sidebarEl = document.getElementById('sidebar');
const toggleSidebarOuterBtn = document.getElementById('toggle-sidebar-outer');
const toggleSidebarInnerBtn = document.getElementById('toggle-sidebar-inner');
const layerListContainer = document.getElementById('layer-list-container');
const layerCardTemplate = document.getElementById('layer-card-template');
const initialMessage = document.getElementById('initial-message');
const styleUrlInput = document.getElementById('style-url-input');
const setStyleButton = document.getElementById('set-style-button');
const mapBearingDisplay = document.getElementById('map-bearing-display');
const mapPitchDisplay = document.getElementById('map-pitch-display');
const backgroundColorInput = document.getElementById('background-color-input');
const backgroundColorHex = document.getElementById('background-color-hex');
const geocoderContainer = document.getElementById('geocoder-container');
// Animation controls
const playPauseButton = document.getElementById('play-pause-button');
const spinSpeedXSlider = document.getElementById('spin-speed-x-slider');
const spinSpeedYSlider = document.getElementById('spin-speed-y-slider');
const spinSpeedXNumber = document.getElementById('spin-speed-x-number');
const spinSpeedYNumber = document.getElementById('spin-speed-y-number');


const eyeIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`;
const eyeOffIcon = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>`;
const playIcon = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4 2.892a.5.5 0 0 1 .798-.401l11.216 6.284a.5.5 0 0 1 0 .802L4.798 17.51a.5.5 0 0 1-.798-.401V2.892Z"></path></svg>`;
const pauseIcon = `<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z"></path></svg>`;


// --- State Management ---
let map; // Initialized in initializeApp
window.map = map;
let layers = new Map(); // Using a Map to store layer state by ID
let layerOrder = []; // Array of layer IDs to manage rendering order
let nextLayerId = 0;
let isSidebarOpen = true;
let currentStyleUrl = 'https://tiles.openfreemap.org/styles/liberty';
let currentBackgroundColor = '#f8fafc';
let initialProjection = 'mercator'; // Track initial projection from URL, default to mercator
// Animation state
let isSpinning = false;
let spinSpeedX = 0.1;
let spinSpeedY = 0.0;
let animationFrameId = null;

// --- Helper Function ---
function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- Map Animation ---
function spinGlobe() {
    if (!isSpinning) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }
    const center = map.getCenter();
    center.lng += spinSpeedX;
    center.lat += spinSpeedY;
    // Clamp latitude to avoid pole flipping issues
    center.lat = Math.max(-85, Math.min(85, center.lat));
    map.easeTo({ center, duration: 0, easing: t => t });
    animationFrameId = requestAnimationFrame(spinGlobe);
}

function toggleSpin(updateUrl = true) {
    isSpinning = !isSpinning;
    if (isSpinning) {
        playPauseButton.innerHTML = pauseIcon;
        spinGlobe();
    } else {
        playPauseButton.innerHTML = playIcon;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }
    if (updateUrl) updateUrlParams();
}

// --- Sidebar Toggle ---
function toggleSidebar(updateUrl = true) {
    isSidebarOpen = !isSidebarOpen;
    sidebarEl.classList.toggle('-translate-x-full', !isSidebarOpen);
    toggleSidebarOuterBtn.classList.toggle('opacity-0', isSidebarOpen);
    toggleSidebarOuterBtn.classList.toggle('pointer-events-none', isSidebarOpen);
    setTimeout(() => map.resize(), 350);
    if (updateUrl) updateUrlParams();
}

// --- File Handling (Drag-and-Drop, Input, URL) ---
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => {
    dropZone.addEventListener(e, preventDefaults, false);
    document.body.addEventListener(e, preventDefaults, false);
});
['dragenter', 'dragover'].forEach(e => dropZone.addEventListener(e, () => dropZone.classList.add('border-primary'), false));
['dragleave', 'drop'].forEach(e => dropZone.addEventListener(e, () => dropZone.classList.remove('border-primary'), false));

function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
function handleDrop(e) { [...e.dataTransfer.files].forEach(handleFile); }

async function loadFromUrl(urlString) {
    console.log(`[DEBUG] Attempting to load from URL: ${urlString}`);
    const placeholderFile = { name: urlString, size: 0 };
    const newLayer = createLayer(placeholderFile, 'url'); // Identify as URL type
    newLayer.status(`Downloading from ${urlString}...`);

    try {
        const response = await fetch(urlString);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const blob = await response.blob();
        const file = new File([blob], urlString.split('/').pop(), { type: blob.type });

        newLayer.file = file;
        const fileInfoEl = newLayer.card.querySelector('.file-info');
        fileInfoEl.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        fileInfoEl.title = file.name;

        addLayerToMap(newLayer);
        processFile(newLayer);
        updateUrlParams();
        updateShareButtonVisibility();
        console.log(`[DEBUG] Successfully initiated loading from URL: ${urlString}`);

    } catch (error) {
        console.error("Failed to load from URL:", error);
        newLayer.status(`❌ Error loading from URL: ${error.message}`, true);
    }
}

// --- Layer Card & State Management ---
function createLayer(file, sourceType = 'local') {
    const layerId = `layer-${nextLayerId++}`;
    const card = layerCardTemplate.content.cloneNode(true).firstElementChild;
    card.dataset.id = layerId;

    const draggableHandle = card.querySelector('.draggable-handle');
    draggableHandle.draggable = true;

    const fileInfoEl = card.querySelector('.file-info');
    const sizeMb = (file.size / 1024 / 1024).toFixed(2);
    fileInfoEl.textContent = sizeMb === '0.00' ? file.name : `${file.name} (${sizeMb} MB)`;
    fileInfoEl.title = file.name;

    const layerState = {
        id: layerId,
        file: file,
        sourceType: sourceType,
        sourceUrl: sourceType === 'url' ? file.name : null,
        card: card, worker: null, geoJsonFeatures: [], isUpdateScheduled: false, isVisible: true, detectedGeomTypes: new Set(),
        styles: { pointColor: '#ff0000', pointOpacity: 0.7, lineColor: '#10b981', lineOpacity: 1.0, polygonFillColor: '#4f46e5', polygonFillOpacity: 0.5, polygonOutlineColor: '#4f46e5', polygonOutlineOpacity: 1.0 },
        status: (message, isError = false) => {
            const statusEl = card.querySelector('.status');
            statusEl.textContent = message;
            statusEl.className = `status text-xs font-mono whitespace-pre-wrap rounded p-2 ${isError ? 'bg-red-50 text-red-800 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-100'}`;
            if (isError) console.error(`[${layerId}] ${message}`);
        },
        updateCounter: (type, value) => {
            const el = card.querySelector(`.${type}-counter`);
            if (el) el.textContent = value.toLocaleString();
        }
    };

    card.querySelectorAll('.style-input').forEach(input => {
        const styleType = input.dataset.styleType;
        input.value = layerState.styles[styleType];
        input.addEventListener('input', (e) => {
            layerState.styles[styleType] = e.target.type === 'range' ? parseFloat(e.target.value) : e.target.value;
            updateLayerPaint(layerId);
        });
    });

    card.querySelector('.reload-file').addEventListener('click', () => {
        if (layerState.sourceType === 'url' && layerState.sourceUrl) {
            const oldCard = layerState.card;
            loadFromUrl(layerState.sourceUrl).then(() => oldCard.remove());
            removeLayer(layerId, false);
        } else {
            processFile(layerState);
        }
    });

    card.querySelector('.remove-file').addEventListener('click', () => removeLayer(layerId));
    const visibilityBtn = card.querySelector('.toggle-visibility');
    visibilityBtn.innerHTML = eyeIcon;
    visibilityBtn.addEventListener('click', () => toggleLayerVisibility(layerId));

    layerListContainer.prepend(card);
    initialMessage.style.display = 'none';
    layers.set(layerId, layerState);
    layerOrder.unshift(layerId);
    addDragAndDropForCard(draggableHandle, card);
    return layerState;
}

function removeLayer(layerId, doUpdateUrl = true) {
    const layer = layers.get(layerId);
    if (!layer) return;

    layer.worker?.terminate();
    ['points', 'lines', 'polygons', 'polygon-outline'].forEach(type => {
        const mapLayerId = `${layer.id}-${type}`;
        if (map.getLayer(mapLayerId)) map.removeLayer(mapLayerId);
    });
    if (map.getSource(layer.id)) map.removeSource(layer.id);

    layer.card.remove();
    layers.delete(layerId);
    layerOrder = layerOrder.filter(id => id !== layerId);

    if (doUpdateUrl) {
        updateUrlParams();
        updateShareButtonVisibility();
    }

    if (layers.size === 0) initialMessage.style.display = 'block';
}

function toggleLayerVisibility(layerId) {
    const layer = layers.get(layerId);
    if (!layer) return;
    layer.isVisible = !layer.isVisible;

    const visibility = layer.isVisible ? 'visible' : 'none';
    ['points', 'lines', 'polygons', 'polygon-outline'].forEach(type => {
        const mapLayerId = `${layer.id}-${type}`;
        if (map.getLayer(mapLayerId)) map.setLayoutProperty(mapLayerId, 'visibility', visibility);
    });
    layer.card.querySelector('.toggle-visibility').innerHTML = layer.isVisible ? eyeIcon : eyeOffIcon;
}

function updateLayerPaint(layerId) {
    const layer = layers.get(layerId);
    if (!layer || !map.getSource(layer.id)) return;
    const { styles } = layer;
    map.setPaintProperty(`${layerId}-points`, 'circle-color', hexToRgba(styles.pointColor, styles.pointOpacity));
    map.setPaintProperty(`${layerId}-lines`, 'line-color', hexToRgba(styles.lineColor, styles.lineOpacity));
    map.setPaintProperty(`${layerId}-polygons`, 'fill-color', hexToRgba(styles.polygonFillColor, styles.polygonFillOpacity));
    map.setPaintProperty(`${layerId}-polygon-outline`, 'line-color', hexToRgba(styles.polygonOutlineColor, styles.polygonOutlineOpacity));
}

function handleFile(file) {
    if (!file) return;
    const newLayer = createLayer(file, 'local');
    if (!map.isStyleLoaded()) {
        map.once('style.load', () => {
            addLayerToMap(newLayer);
            processFile(newLayer);
        });
    } else {
        addLayerToMap(newLayer);
        processFile(newLayer);
    }
}

function processFile(layer) {
    resetLayerState(layer);
    layer.status(`Processing: ${layer.file.name}`);
    layer.worker?.terminate();
    const featureLimit = parseInt(limitInput.value, 10);
    if (isNaN(featureLimit) || featureLimit <= 0) {
        layer.status("Error: Invalid feature limit.", true);
        return;
    }
    layer.worker = new Worker('./worker.js', { type: 'module' });
    layer.worker.onmessage = (event) => handleWorkerMessage(event, layer.id);
    layer.worker.postMessage({ type: 'processFile', file: layer.file, limit: featureLimit });
}

function resetLayerState(layer) {
    layer.geoJsonFeatures = [];
    layer.isUpdateScheduled = false;
    layer.detectedGeomTypes.clear();
    layer.card.querySelectorAll('.style-control').forEach(el => el.classList.add('hidden'));
    const source = map.getSource(layer.id);
    if (source) source.setData({ type: 'FeatureCollection', features: [] });
    layer.updateCounter('batch', 0);
    layer.updateCounter('processed', 0);
    layer.updateCounter('map', 0);
}

function handleWorkerMessage(event, layerId) {
    const layer = layers.get(layerId);
    if (!layer) return;

    const { type, payload } = event.data;
    const updateStrategy = document.querySelector('input[name="update-strategy"]:checked').value;

    switch (type) {
        case 'status':
            layer.status(payload.message);
            if (payload.batchCount) layer.updateCounter('batch', payload.batchCount);
            if (payload.totalProcessed) layer.updateCounter('processed', payload.totalProcessed);
            break;
        case 'features':
            if (layer.detectedGeomTypes.size === 0 && payload.length > 0) {
                payload.forEach(f => {
                    const geomType = f.geometry.type;
                    if (geomType === 'MultiPolygon') layer.detectedGeomTypes.add('Polygon');
                    else if (geomType === 'MultiLineString') layer.detectedGeomTypes.add('LineString');
                    else if (geomType === 'MultiPoint') layer.detectedGeomTypes.add('Point');
                    else layer.detectedGeomTypes.add(geomType);
                });
                layer.card.querySelectorAll('.style-control').forEach(control => {
                    if (layer.detectedGeomTypes.has(control.dataset.geomType)) control.classList.remove('hidden');
                });
            }
            payload.forEach(f => f.id = `${layer.id}-${f.id}`);
            layer.geoJsonFeatures.push(...payload);
            if (updateStrategy === 'live') scheduleMapUpdate(layer);
            else layer.updateCounter('map', layer.geoJsonFeatures.length);
            break;
        case 'done':
            const finalMsg = payload.limitReached ? `✅ Stopped at limit of ${payload.limit.toLocaleString()}.` : `✅ Finished streaming.`;
            layer.status(finalMsg);
            if (updateStrategy === 'final') forceFinalUpdate(layer);
            fitMapToBounds(layer.geoJsonFeatures);
            break;
        case 'error':
            layer.status(`❌ Worker Error: ${payload.message}`, true);
            break;
    }
}

function scheduleMapUpdate(layer) {
    if (!layer.isUpdateScheduled) {
        layer.isUpdateScheduled = true;
        requestAnimationFrame(() => updateMapData(layer));
    }
}

function updateMapData(layer) {
    if (!layer) return;
    const source = map.getSource(layer.id);
    if (source) source.setData({ type: 'FeatureCollection', features: layer.geoJsonFeatures });
    layer.updateCounter('map', layer.geoJsonFeatures.length);
    layer.isUpdateScheduled = false;
}

function forceFinalUpdate(layer) {
    layer.isUpdateScheduled = false;
    updateMapData(layer);
}

function addLayerToMap(layer) {
    const layerId = layer.id;
    const { styles } = layer;
    if (map.getSource(layerId)) return;
    map.addSource(layerId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, promoteId: 'id' });
    const layerDefinitions = [
        { id: `${layerId}-points`, type: 'circle', filter: ['==', '$type', 'Point'], paint: { 'circle-radius': 4, 'circle-color': hexToRgba(styles.pointColor, styles.pointOpacity), 'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0], 'circle-stroke-color': '#ffffff' } },
        { id: `${layerId}-lines`, type: 'line', filter: ['==', '$type', 'LineString'], paint: { 'line-color': hexToRgba(styles.lineColor, styles.lineOpacity), 'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 4, 2] } },
        { id: `${layerId}-polygons`, type: 'fill', filter: ['==', '$type', 'Polygon'], paint: { 'fill-color': hexToRgba(styles.polygonFillColor, styles.polygonFillOpacity), 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.7, 1] } },
        { id: `${layerId}-polygon-outline`, type: 'line', filter: ['==', '$type', 'Polygon'], paint: { 'line-color': hexToRgba(styles.polygonOutlineColor, styles.polygonOutlineOpacity), 'line-width': 1 } },
    ];
    layerDefinitions.forEach(def => {
        map.addLayer({ ...def, source: layerId });
        setupLayerInteractivity(def.id);
    });
}

function reorderMapLayers() {
    const globalLayerOrder = ['polygons', 'polygon-outline', 'lines', 'points'];
    [...layerOrder].reverse().forEach(layerId => {
        globalLayerOrder.forEach(type => {
            const mapLayerId = `${layerId}-${type}`;
            if (map.getLayer(mapLayerId)) map.moveLayer(mapLayerId);
        });
    });
}

// --- Map Interactivity (Popup, Hover) ---
const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '350px', className: 'bg-white/95 backdrop-blur shadow-lg rounded-lg' });
let hoveredFeature = null;

function setupLayerInteractivity(mapLayerId) {
    map.on('mousemove', mapLayerId, (e) => {
        if (!e.features || e.features.length === 0) return;
        map.getCanvas().style.cursor = 'pointer';
        const currentFeature = e.features[0];
        const properties = Object.entries(currentFeature.properties || {}).filter(([key]) => !key.toLowerCase().includes('geometry')).map(([key, value]) => `<div class="mb-1"><span class="font-medium text-gray-700">${key}:</span> <span class="text-gray-900 break-all">${value}</span></div>`).join('');
        popup.setLngLat(e.lngLat).setHTML(`<div class="p-2 text-sm">${properties}</div>`).addTo(map);
        const hasValidId = currentFeature.id !== undefined && currentFeature.id !== null;
        if (hoveredFeature && (!hasValidId || hoveredFeature.id !== currentFeature.id)) {
            if (map.getSource(hoveredFeature.source)) map.setFeatureState({ source: hoveredFeature.source, id: hoveredFeature.id }, { hover: false });
            hoveredFeature = null;
        }
        if (hasValidId && (!hoveredFeature || hoveredFeature.id !== currentFeature.id)) {
            hoveredFeature = { id: currentFeature.id, source: currentFeature.source };
            map.setFeatureState({ source: hoveredFeature.source, id: hoveredFeature.id }, { hover: true });
        }
    });
    map.on('mouseleave', mapLayerId, () => {
        map.getCanvas().style.cursor = '';
        if (hoveredFeature && map.getSource(hoveredFeature.source)) map.setFeatureState({ source: hoveredFeature.source, id: hoveredFeature.id }, { hover: false });
        hoveredFeature = null;
        popup.remove();
    });
}

function fitMapToBounds(features) {
    if (features.length === 0 || !map.loaded()) return;
    const bounds = new maplibregl.LngLatBounds();
    features.forEach(feature => {
        const type = feature.geometry?.type;
        const coords = feature.geometry?.coordinates;
        if (!coords) return;
        if (type === 'Point') bounds.extend(coords);
        else if (type === 'LineString' || type === 'MultiPoint') coords.forEach(c => bounds.extend(c));
        else if (type === 'Polygon' || type === 'MultiLineString') coords.forEach(ring => ring.forEach(c => bounds.extend(c)));
        else if (type === 'MultiPolygon') coords.forEach(poly => poly.forEach(ring => ring.forEach(c => bounds.extend(c))));
    });
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
}

// --- Drag & Drop for Layer Reordering ---
let draggedItem = null;
layerListContainer.addEventListener('dragenter', e => e.preventDefault());
layerListContainer.addEventListener('drop', () => {
    if (!draggedItem) return;
    draggedItem.classList.remove('dragging');
    [...layerListContainer.children].forEach(child => child.classList.remove('drag-over'));
    layerOrder = [...layerListContainer.children].map(child => child.dataset.id).filter(Boolean);
    reorderMapLayers();
    draggedItem = null;
});

function addDragAndDropForCard(handle, card) {
    handle.addEventListener('dragstart', () => { draggedItem = card; setTimeout(() => card.classList.add('dragging'), 0); });
    card.addEventListener('dragover', (e) => {
        e.preventDefault(); if (!draggedItem) return;
        const afterElement = getDragAfterElement(layerListContainer, e.clientY);
        [...layerListContainer.children].forEach(child => child.classList.remove('drag-over'));
        if (afterElement) afterElement.classList.add('drag-over');
        if (afterElement == null) layerListContainer.appendChild(draggedItem);
        else layerListContainer.insertBefore(draggedItem, afterElement);
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(':scope > div:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- URL State Management & Sharing ---
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function updateUrlParams() {
    if (!map) {
        console.log('[DEBUG] updateUrlParams skipped: Map or style not ready.');
        return;
    }

    const params = new URLSearchParams();
    const center = map.getCenter();
    const zoom = map.getZoom().toFixed(2);
    const bearing = map.getBearing().toFixed(2);
    const pitch = map.getPitch().toFixed(2);
    params.set('map', `${zoom}/${center.lat.toFixed(5)}/${center.lng.toFixed(5)}/${bearing}/${pitch}`);
    params.set('sidebar', isSidebarOpen ? '1' : '0');
    params.set('style', currentStyleUrl);
    params.set('background', currentBackgroundColor);
    params.set('spinSpeedX', spinSpeedX.toString());
    params.set('spinSpeedY', spinSpeedY.toString());
    if (isSpinning) {
        params.set('play', '1');
    }

    const projection = map.getProjection();
    if (!projection) {
        console.log('[DEBUG] updateUrlParams: Projection not yet available.');
    }
    else {
        const projectionName = projection.type
        console.log(`[DEBUG] updateUrlParams called. Current projection: '${projectionName}'`);
        if (projectionName === 'globe') {
            params.set('projection', 'globe');
        } else {
            params.delete('projection');
        }
    }


    for (const layer of layers.values()) {
        if (layer.sourceType === 'url') params.append('url', layer.sourceUrl);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    console.log(`[DEBUG] New URL generated: ${newUrl}`);
    history.replaceState({}, '', newUrl);
}

function updateMapInfoDisplay() {
    requestAnimationFrame(() => {
        mapBearingDisplay.textContent = `Bearing: ${map.getBearing().toFixed(1)}°`;
        mapPitchDisplay.textContent = `Pitch: ${map.getPitch().toFixed(1)}°`;
    });
}

function handleSetStyle() {
    const newStyleUrl = styleUrlInput.value.trim();
    if (!newStyleUrl) return;
    try {
        new URL(newStyleUrl);
        currentStyleUrl = newStyleUrl;
        console.log(`[DEBUG] Setting new map style: ${newStyleUrl}`);
        map.setStyle(newStyleUrl);
        updateUrlParams();
    } catch (e) {
        alert("Invalid Basemap Style URL. Please enter a valid URL.");
    }
}

const debouncedUpdateUrlForMap = debounce(updateUrlParams, 50);

// --- Initial App Load ---
function initializeApp() {
    console.log('[DEBUG] initializeApp: Starting application initialization.');
    const params = new URLSearchParams(window.location.search);

    if (params.get('projection') === 'globe') {
        initialProjection = 'globe';
        console.log('[DEBUG] initializeApp: Found "projection=globe" in URL.');
    } else {
        initialProjection = 'mercator';
        console.log('[DEBUG] initializeApp: No projection in URL, defaulting to mercator.');
    }

    const styleParam = params.get('style');
    if (styleParam) {
        try {
            new URL(styleParam); currentStyleUrl = styleParam;
        } catch (e) { console.warn("Invalid style URL param, using default."); }
    }
    styleUrlInput.value = currentStyleUrl;

    const backgroundParam = params.get('background');
    if (backgroundParam) {
        currentBackgroundColor = backgroundParam;
    }
    backgroundColorInput.value = currentBackgroundColor;
    backgroundColorHex.textContent = currentBackgroundColor;

    const mapParam = params.get('map');
    let initialMapView = { center: [11.5, 48.1], zoom: 5, bearing: 0, pitch: 0 };
    if (mapParam) {
        const [zoom, lat, lng, bearing, pitch] = mapParam.split('/');
        initialMapView = { center: [parseFloat(lng), parseFloat(lat)], zoom: parseFloat(zoom), bearing: parseFloat(bearing), pitch: parseFloat(pitch) };
    }

    if (params.get('sidebar') === '0') {
        isSidebarOpen = false;
        sidebarEl.classList.add('-translate-x-full');
        toggleSidebarOuterBtn.classList.remove('opacity-0', 'pointer-events-none');
    } else {
        toggleSidebarOuterBtn.classList.add('opacity-0', 'pointer-events-none');
    }

    // Animation URL params
    const spinXParam = params.get('spinSpeedX');
    if (spinXParam !== null) spinSpeedX = parseFloat(spinXParam);
    spinSpeedXSlider.value = spinSpeedX;
    spinSpeedXNumber.value = spinSpeedX;

    const spinYParam = params.get('spinSpeedY');
    if (spinYParam !== null) spinSpeedY = parseFloat(spinYParam);
    spinSpeedYSlider.value = spinSpeedY;
    spinSpeedYNumber.value = spinSpeedY;

    console.log('[DEBUG] initializeApp: Initializing MapLibre map with view:', initialMapView);
    map = new maplibregl.Map({ container: 'map', style: currentStyleUrl, ...initialMapView });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
    map.addControl(new maplibregl.GlobeControl(), 'bottom-right');

    const geocoderApi = {
        forwardGeocode: async (config) => {
            const features = [];
            try {
                const q = config.query;
                const endpoint = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`;
                const response = await fetch(endpoint);
                const data = await response.json();
                for (const f of data.features) {
                    const center = f.geometry.coordinates;
                    const feature = { type: 'Feature', center: center, geometry: f.geometry, place_name: f.properties.name, properties: f.properties, place_type: ['place'], text: f.properties.name };
                    features.push(feature);
                }
            } catch (e) { console.error(`Failed to forwardGeocode with error: ${e}`); }
            return { features };
        }
    };
    const geocoder = new MaplibreGeocoder(geocoderApi, { maplibregl: maplibregl });
    geocoderContainer.appendChild(geocoder.onAdd(map));

    toggleSidebarOuterBtn.addEventListener('click', () => toggleSidebar());
    toggleSidebarInnerBtn.addEventListener('click', () => toggleSidebar());
    dropZone.addEventListener('drop', handleDrop, false);
    dropZone.addEventListener('click', () => fileInput.click(), false);
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) { [...e.target.files].forEach(handleFile); fileInput.value = ''; }
    });
    loadUrlButton.addEventListener('click', () => { if (urlInput.value) { loadFromUrl(urlInput.value); urlInput.value = ''; } });
    setStyleButton.addEventListener('click', handleSetStyle);
    backgroundColorInput.addEventListener('input', (e) => {
        currentBackgroundColor = e.target.value;
        backgroundColorHex.textContent = currentBackgroundColor;
        map.getCanvas().style.backgroundColor = currentBackgroundColor;
        // Debounce update to avoid spamming history
        debouncedUpdateUrlForMap();
    });

    // --- Animation Listeners ---
    playPauseButton.addEventListener('click', () => toggleSpin());

    spinSpeedXSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        spinSpeedX = val;
        spinSpeedXNumber.value = val;
        debouncedUpdateUrlForMap();
    });
    spinSpeedXNumber.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val)) return;
        spinSpeedX = val;
        spinSpeedXSlider.value = val;
        debouncedUpdateUrlForMap();
    });

    spinSpeedYSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        spinSpeedY = val;
        spinSpeedYNumber.value = val;
        debouncedUpdateUrlForMap();
    });
    spinSpeedYNumber.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (isNaN(val)) return;
        spinSpeedY = val;
        spinSpeedYSlider.value = val;
        debouncedUpdateUrlForMap();
    });


    // --- Map Event Listeners ---
    map.on('moveend', () => {
        console.log("[DEBUG] Map event: 'moveend'");
        // Only update if not spinning, to avoid overwriting the animation's movement
        if (!isSpinning) {
            debouncedUpdateUrlForMap();
        }
    });
    map.on('dragstart', () => {
        if (isSpinning) toggleSpin(false); // Stop spinning on drag, don't update URL yet
    });
    map.on('zoomstart', () => {
        if (isSpinning) toggleSpin(false); // Stop spinning on zoom
    });
    map.on('move', updateMapInfoDisplay);

    map.on('projectiontransition', () => {
        console.log("[DEBUG] Map event: projectiontransition");
        debouncedUpdateUrlForMap();
    });

    // This is the primary listener for style changes. It re-adds layers and applies the projection.
    map.on('style.load', () => {
        console.log("[DEBUG] Map event: 'style.load' triggered.");
        map.getCanvas().style.backgroundColor = currentBackgroundColor;
        for (const layerId of layerOrder) {
            const layer = layers.get(layerId);
            if (layer) {
                console.log(`[DEBUG] 'style.load': Re-adding layer ${layerId}`);
                addLayerToMap(layer);
                updateMapData(layer);
            }
        }
        reorderMapLayers();

        // Apply the desired projection AFTER the style has loaded.
        console.log(`[DEBUG] 'style.load': initial target is '${initialProjection}'`);
        if (initialProjection === 'globe') {
            console.log("[DEBUG] 'style.load': Applying 'globe' projection now.");
            map.setProjection({ type: 'globe' });
        }
    });

    // This listener helps catch when the projection has actually finished changing.
    // It's a reliable place to update the URL.
    map.on('data', (e) => {
        if (e.dataType === 'source' && e.sourceDataType === 'metadata') {
            // This event often fires after a projection change is complete.
            console.log("[DEBUG] Map event: 'data' (metadata). Debouncing URL update.");
            debouncedUpdateUrlForMap();
        }
    });

    // The 'load' event fires once after the map has been fully initialized.
    map.once('load', () => {
        console.log("[DEBUG] Map event: 'load' (fired once).");

        // Load remote datasets from URL parameters *after* the map is fully ready.
        params.getAll('url').forEach(url => {
            console.log(`[DEBUG] 'load': Loading URL from params: ${url}`);
            loadFromUrl(url);
        });
        updateMapInfoDisplay();

        // Auto-play if specified in URL
        if (params.get('play') === '1') {
            toggleSpin(false); // Start spinning but don't re-update the URL
        } else {
            playPauseButton.innerHTML = playIcon;
        }

        // A final update to ensure the initial state is captured correctly.
        console.log("[DEBUG] 'load': Calling updateUrlParams()");
        updateUrlParams();
    });
}

initializeApp();

// Unique namespace variables
const shrUrl = encodeURIComponent(window.location.href);
const shrTitle = encodeURIComponent(document.title);

// Assign share links
const shrLinks = {
    "shr-whatsapp": `https://wa.me/?text=${shrTitle}%20${shrUrl}`,
    "shr-telegram": `https://t.me/share/url?url=${shrUrl}&text=${shrTitle}`,
    "shr-twitter": `https://twitter.com/intent/tweet?url=${shrUrl}&text=${shrTitle}`,
    "shr-facebook": `https://www.facebook.com/sharer/sharer.php?u=${shrUrl}`,
    "shr-linkedin": `https://www.linkedin.com/shareArticle?mini=true&url=${shrUrl}&title=${shrTitle}`,
    "shr-reddit": `https://www.reddit.com/submit?url=${shrUrl}&title=${shrTitle}`,
    "shr-pinterest": `https://pinterest.com/pin/create/button/?url=${shrUrl}&description=${shrTitle}`,
    "shr-email": `mailto:?subject=${shrTitle}&body=${shrUrl}`
};

for (const id in shrLinks) {
    document.getElementById(id).href = shrLinks[id];
}

// Native share
document.getElementById("shr-native").addEventListener("click", async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: document.title,
                text: "Check this out!",
                url: window.location.href
            });
        } catch (err) {
            console.error("Share failed:", err);
        }
    } else {
        alert("Web Share API not supported in this browser.");
    }
});

// Copy URL with feedback
const shrCopyBtn = document.getElementById("shr-copy");
shrCopyBtn.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(window.location.href);
        shrCopyBtn.innerHTML = '<i class="fa-solid fa-check text-[13px]"></i>';
        setTimeout(() => {
            shrCopyBtn.innerHTML = '<i class="fa-solid fa-link text-[13px]"></i>';
        }, 1500);
    } catch (err) {
        console.error("Copy failed:", err);
    }
});
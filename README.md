# GeoParquet Visualizer
A maplibre-based GeoParquet and Parquet visualizer using Kyle Barron's [parquet-wasm](https://github.com/kylebarron/parquet-wasm/tree/v0.7.0)
Works for up to 2 million points out of the box with plain maplibre.
 
## Intro Video
[![GeoParquet Visualizer](https://github.com/user-attachments/assets/c084e697-42e4-44c5-aabe-ca68ec602c80)](https://youtu.be/n4akVwYll8E "Display millions of points in maplibre!")

## Features

*   **Loading Data**: Visualize `.parquet` or `.geoparquet` files by dragging them from your desktop or loading them from a remote URL.
*   **Plain Parquet Support**: Automatically detects `lon`/`lat` columns as point geometry if no WKB geometry column is found.
*   **Dynamic Styling**: Change the color and opacity of points, lines, and polygons for each layer on the fly.
*   **Layer Management**: Reorder layers by dragging and dropping them in the sidebar to control which datasets appear on top.
*   **Stateful URLs**: The map's view, loaded remote datasets, and even the basemap style are stored in the URL, so you can share your exact session with others.
*   **Inspect Features**: Hover over any point, line, or polygon to see its properties in a popup.

## Sharing and Configuration with URL Parameters

One of the most powerful features of the visualizer is its ability to be controlled entirely through URL parameters. This makes it easy to bookmark specific views, pre-load datasets, and share your customized map with others.

Example for loading a remote geoparquet file from Huggingface, setting the view to it's extent and closing the sidebar: https://do-me.github.io/geoparquet-visualizer/?map=9.77%2F45.73225%2F7.39115%2F0.00%2F0.00&sidebar=0&style=https%3A%2F%2Ftiles.openfreemap.org%2Fstyles%2Fliberty&url=https://huggingface.co/datasets/do-me/Italian_Parcels/resolve/main/VALLE-AOSTA_communes.geoparquet

Here’s how it works:

#### `url`

Loads a remote Parquet or GeoParquet file. You can add multiple `url` parameters to load several files at once.

*   **Example**: `?url=https://path/to/my/data.geoparquet`

#### `map`

Sets the exact view of the map. The format is `zoom/latitude/longitude/bearing/pitch`.

*   **zoom**: The map's zoom level.
*   **latitude/longitude**: The coordinates of the map's center.
*   **bearing**: The rotation of the map in degrees (0 = North).
*   **pitch**: The tilt of the map in degrees (0 = flat).
*   **Example**: `?map=12/40.7128/-74.0060/30/60` (This will show New York City, zoomed in and tilted).

#### `style`

Changes the underlying basemap. You can use any MapLibre-compatible style JSON URL.

*   **Example**: https://do-me.github.io/geoparquet-visualizer/?style=https://tiles.openfreemap.org/styles/positron

#### `sidebar`

Controls whether the sidebar is open or closed on load. Use `1` for open and `0` for closed.

*   **Example**: `?sidebar=0`

This way you can embed this map viewer as an iframe on any html page and dynamically load data. Keep in mind that if the datasets become too large, it will take ages too load and break at some point.

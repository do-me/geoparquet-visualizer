# GeoParquet Visualizer
A maplibre-based GeoParquet and Parquet visualizer using Kyle Barron's [parquet-wasm](https://github.com/kylebarron/parquet-wasm/tree/v0.7.0)
Works for up to 2 million points out of the box with plain maplibre. Customize everything and share the map with friends!
 
## Intro Video
[![GeoParquet Visualizer](https://github.com/user-attachments/assets/c084e697-42e4-44c5-aabe-ca68ec602c80)](https://youtu.be/n4akVwYll8E "Display millions of points in maplibre!")

## Features

*   **Loading Data**: Visualize `.parquet` or `.geoparquet` files by dragging them from your desktop or loading them from a remote URL.
*   **Plain Parquet Support**: Automatically detects `lon`/`lat` columns as point geometry if no WKB geometry column is found.
*   **Dynamic Styling**: Change the color and opacity of points, lines, and polygons for each layer on the fly.
*   **Globe View**: Toggle between the standard Mercator projection and a beautiful 3D globe view.
*   **Geocoder Search**: Easily navigate the map by searching for locations worldwide.
*   **Layer Management**: Reorder layers by dragging and dropping them in the sidebar to control which datasets appear on top.
*   **Stateful URLs**: The map's view, projection, loaded datasets, basemap style, and background color are stored in the URL, so you can share your exact session with others.
*   **Inspect Features**: Hover over any point, line, or polygon to see its properties in a popup.

## Sharing and Configuration with URL Parameters

One of the most powerful features of the visualizer is its ability to be controlled entirely through URL parameters. This makes it easy to bookmark specific views, pre-load datasets, and share your customized map with others.

Example for loading a remote geoparquet file, setting the view to a tilted globe with a black background, and closing the sidebar: `https://do-me.github.io/geoparquet-visualizer/?map=9.77/45.73/7.39/30.00/60.00&sidebar=0&style=https://tiles.openfreemap.org/styles/liberty&background=%23000000&projection=globe&url=https://huggingface.co/datasets/do-me/Italian_Parcels/resolve/main/VALLE-AOSTA_communes.geoparquet`

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

*   **OpenFreeMap**: `?style=https://tiles.openfreemap.org/styles/positron`
*   **Mapterhorn DEM**: `?style=https://gist.githubusercontent.com/do-me/558e292a395087eaae3eff55f75b305c/raw/cbb2e5210e64a95e3798db740875c7b14393d7a4/style.json` (I needed to wrap the style in a gist for a public style url)

#### `sidebar`

Controls whether the sidebar is open or closed on load. Use `1` for open and `0` for closed.

*   **Example**: `?sidebar=0`

#### `projection`

Sets the map's projection on load. Set to `globe` to enable the 3D globe view. If omitted, it defaults to the standard `mercator` projection.

*   **Example**: `?projection=globe`

#### `background`

Sets the background color of the map canvas. This is especially useful for creating stunning globe views in a "space" like environment. Colors should be URL-encoded hex values.

*   **Example**: `?background=%231a202c` (sets the background to a dark gray).

This way you can embed this map viewer as an iframe on any html page and dynamically load data. Keep in mind that if the datasets become too large, it will take ages too load and break at some point.
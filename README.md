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

Example for loading a remote geoparquet file, setting the view to a tilted globe with a black background, and closing the sidebar: https://do-me.github.io/geoparquet-visualizer/?map=9.77/45.73/7.39/30.00/60.00&sidebar=0&style=https://tiles.openfreemap.org/styles/liberty&background=%23000000&projection=globe&url=https://huggingface.co/datasets/do-me/Italian_Parcels/resolve/main/VALLE-AOSTA_communes.geoparquet

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

Changes the underlying basemap. You can use any MapLibre-compatible style JSON URL. See the examples of cool background maps below. My favorite one is the one flying over the Alps starting from the Matterhorn!

*   [**2D - MapTiler Hillshade**](https://do-me.github.io/geoparquet-visualizer/?map=8.31%2F45.30185%2F7.37362%2F-22.50%2F1.00&sidebar=1&style=https%3A%2F%2Fgist.githubusercontent.com%2Fdo-me%2F558e292a395087eaae3eff55f75b305c%2Fraw%2Fcbb2e5210e64a95e3798db740875c7b14393d7a4%2Fstyle.json&background=%23f8fafc&spinSpeedX=0.10&spinSpeedY=0.00&projection=globe)
*   [**2D - OpenFreeMap OSM Vector Tiles**](https://do-me.github.io/geoparquet-visualizer/?map=4.65%2F48.73090%2F13.84026%2F0.00%2F0.00&sidebar=1&style=https%3A%2F%2Ftiles.openfreemap.org%2Fstyles%2Fliberty&background=%23f8fafc&spinSpeedX=0.10&spinSpeedY=0.00)
*   [**3D - MapTiler Terrain DEM + ArcGIS Raster**](https://do-me.github.io/geoparquet-visualizer/?map=14.59%2F46.48154%2F8.57105%2F-161.82%2F53.50&sidebar=1&style=https%3A%2F%2Fgist.githubusercontent.com%2Fdo-me%2Fc67c3e101d9ade662c4986bb03e1f309%2Fraw%2F661a6000de28d034384618ddd407479f91836703%2Fstyle.json&background=%230052a3&spinSpeedX=0.05&spinSpeedY=0.00&projection=globe)
*   [**3D - MapTiler Terrain DEM + ArcGIS Raster - animated, starting at Matterhorn**](https://do-me.github.io/geoparquet-visualizer/?map=13.16%2F45.98136%2F7.67537%2F-52.96%2F53.50&sidebar=1&style=https%3A%2F%2Fgist.githubusercontent.com%2Fdo-me%2Fc67c3e101d9ade662c4986bb03e1f309%2Fraw%2F661a6000de28d034384618ddd407479f91836703%2Fstyle.json&background=%230052a3&spinSpeedX=0.0001&spinSpeedY=0&play=1)
*   [**3D - MapTiler Terrain DEM + OSM Raster**](https://do-me.github.io/geoparquet-visualizer/?map=12.88%2F45.96428%2F7.70218%2F-49.03%2F60.00&sidebar=0&style=https%3A%2F%2Fgist.githubusercontent.com%2Fdo-me%2F1fdc8f081ac622f2191693f9f2c1dfc4%2Fraw%2Fd7600b8cee675c0de14a03017f5d5791724e2781%2Fstyle.json&background=%230052a3&spinSpeedX=0.05&spinSpeedY=0)

<p align="center">
  <a href="https://do-me.github.io/geoparquet-visualizer/?map=14.59%2F46.48154%2F8.57105%2F-161.82%2F53.50&sidebar=1&style=https%3A%2F%2Fgist.githubusercontent.com%2Fdo-me%2Fc67c3e101d9ade662c4986bb03e1f309%2Fraw%2F661a6000de28d034384618ddd407479f91836703%2Fstyle.json&background=%230052a3&spinSpeedX=0.05&spinSpeedY=0.00&projection=globe" target="_blank">
    <img src="screenshots/dem_arcgis_raster.png" width="400" alt="3D - MapTiler Terrain DEM + ArcGIS Raster"/>
  </a>
  <a href="https://do-me.github.io/geoparquet-visualizer/?map=13.16%2F45.98136%2F7.67537%2F-52.96%2F53.50&sidebar=1&style=https%3A%2F%2Fgist.githubusercontent.com%2Fdo-me%2Fc67c3e101d9ade662c4986bb03e1f309%2Fraw%2F661a6000de28d034384618ddd407479f91836703%2Fstyle.json&background=%230052a3&spinSpeedX=0.0001&spinSpeedY=0&play=1" target="_blank">
    <img src="screenshots/dem_arcgis_raster_animated.png" width="400" alt="3D - MapTiler Terrain DEM + ArcGIS Raster - animated"/>
  </a>
  <a href="https://do-me.github.io/geoparquet-visualizer/?map=12.88%2F45.96428%2F7.70218%2F-49.03%2F60.00&sidebar=0&style=https%3A%2F%2Fgist.githubusercontent.com%2Fdo-me%2F1fdc8f081ac622f2191693f9f2c1dfc4%2Fraw%2Fd7600b8cee675c0de14a03017f5d5791724e2781%2Fstyle.json&background=%230052a3&spinSpeedX=0.05&spinSpeedY=0" target="_blank">
    <img src="screenshots/dem_osm_raster.png" width="400" alt="3D - MapTiler Terrain DEM + OSM Raster"/>
  </a>
  <a href="https://do-me.github.io/geoparquet-visualizer/?map=8.31%2F45.30185%2F7.37362%2F-22.50%2F1.00&sidebar=1&style=https%3A%2F%2Fgist.githubusercontent.com%2Fdo-me%2F558e292a395087eaae3eff55f75b305c%2Fraw%2Fcbb2e5210e64a95e3798db740875c7b14393d7a4%2Fstyle.json&background=%23f8fafc&spinSpeedX=0.10&spinSpeedY=0.00&projection=globe" target="_blank">
    <img src="screenshots/hillshade.png" width="400" alt="2D - MapTiler Hillshade"/>
  </a>
  <a href="https://do-me.github.io/geoparquet-visualizer/?map=4.65%2F48.73090%2F13.84026%2F0.00%2F0.00&sidebar=1&style=https%3A%2F%2Ftiles.openfreemap.org%2Fstyles%2Fliberty&background=%23f8fafc&spinSpeedX=0.10&spinSpeedY=0.00" target="_blank">
    <img src="screenshots/openfreemap.png" width="400" alt="2D - OpenFreeMap OSM Vector Tiles"/>
  </a>
</p>


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

## Author
-  Dominik Weckmüller (https://geo.rocks)
// parser.js

import * as arrow from 'https://esm.sh/apache-arrow';
import * as parquet from 'https://cdn.jsdelivr.net/npm/parquet-wasm@0.7.0/esm/parquet_wasm.js';

let wasmInitialized = false;

// Async generator function to process the file stream, now accepting a feature limit.
export async function* processParquetStream(file, limit = Infinity) {
    if (!wasmInitialized) {
        // As per the parquet-wasm README, await the default export to initialize
        await parquet.default();
        wasmInitialized = true;
    }
    
    // Send an initial status message from the worker once it's ready to process
    self.postMessage({ type: 'status', payload: { message: "WASM modules initialized. Reading file...", batchCount: 0, totalProcessed: 0 } });

    const parquetFile = await parquet.ParquetFile.fromFile(file);
    const recordBatchStream = await parquetFile.stream();
    const reader = recordBatchStream.getReader();

    let totalProcessed = 0;
    let limitReached = false;

    while (true) {
        const { done, value: wasmRecordBatch } = await reader.read();
        if (done) break;

        // This `intoIPCStream` call consumes `wasmRecordBatch`, freeing its memory.
        const ipcStream = wasmRecordBatch.intoIPCStream();
        const table = arrow.tableFromIPC(ipcStream);

        const batchFeatures = [];
        const rowArray = table.toArray();

        for (const rowObject of rowArray) {
            // Check the feature limit before processing the row.
            if (totalProcessed >= limit) {
                limitReached = true;
                break; // Exit this inner for-loop over rows
            }

            // First convert to a plain object using toJSON
            const jsonData = rowObject.toJSON();
            const row = {};
            
            // Handle each field, paying special attention to binary/geometry data
            for (const [key, value] of Object.entries(jsonData)) {
                // Skip null values
                if (value === null) {
                    row[key] = null;
                    continue;
                }
                
                // Handle binary/geometry data
                if (value instanceof Uint8Array) {
                    row[key] = new Uint8Array(value);
                } else {
                    // For all other types, use the value as is
                    row[key] = value;
                }
            }
            let geometry = null;
            
            // Priority 1: Try to parse WKB geometry
            if (row.geometry instanceof Uint8Array) {
                const buffer = row.geometry.buffer.slice(
                    row.geometry.byteOffset,
                    row.geometry.byteOffset + row.geometry.byteLength
                );
                geometry = parseWKB(buffer);
            }
            // Fallback: Use lon/lat columns if they exist and are valid
            else if (isValidCoordinate(row.lon) && isValidCoordinate(row.lat)) {
                geometry = { type: 'Point', coordinates: [row.lon, row.lat] };
            }
            
            if (geometry) {
                // Create a clean properties object
                const properties = { ...row };
                delete properties.geometry;
                delete properties.geometry_bbox;  // Also remove the bbox geometry
                delete properties.lon;
                delete properties.lat;
                
                batchFeatures.push({
                    type: 'Feature',
                    id: totalProcessed, // Add a unique ID for each feature
                    geometry: geometry,
                    properties: sanitizeProperties(properties) // Sanitize for BigInts
                });
                totalProcessed++;
            }
        }
        
        // Yield the result for this batch
        yield {
            features: batchFeatures,
            totalProcessed: totalProcessed,
            limitReached: limitReached,
        };

        // If the limit was reached in the inner loop, break the outer loop as well.
        if (limitReached) {
            // Crucially, cancel the reader to stop downloading/processing the rest of the file.
            await reader.cancel();
            break;
        }
    }
}

function isValidCoordinate(value) {
    return value !== undefined && value !== null && typeof value === 'number' && !isNaN(value);
}

// Function to parse Well-Known Binary (WKB) geometry
function parseWKB(wkbBuffer) {
    try {
        const view = new DataView(wkbBuffer);
        let offset = 0;
        
        const byteOrder = view.getUint8(offset++);
        const littleEndian = byteOrder === 1;
        const geomType = view.getUint32(offset, littleEndian);
        offset += 4;
        
        const actualGeomType = geomType & 0xFF; // Handle different WKB variants

        // Helper function to read a point
        function readPoint() {
            const x = view.getFloat64(offset, littleEndian);
            offset += 8;
            const y = view.getFloat64(offset, littleEndian);
            offset += 8;
            return [x, y];
        }

        // Helper function to read a ring (for polygons)
        function readLinearRing() {
            const numPoints = view.getUint32(offset, littleEndian);
            offset += 4;
            const points = [];
            for (let i = 0; i < numPoints; i++) {
                points.push(readPoint());
            }
            return points;
        }
        
        // Helper to read all rings for a single polygon
        function readPolygonRings() {
             const numRings = view.getUint32(offset, littleEndian);
             offset += 4;
             const rings = [];
             for (let i = 0; i < numRings; i++) {
                 rings.push(readLinearRing());
             }
             return rings;
        }
        
        switch (actualGeomType) {
            case 1: // Point
                return { type: 'Point', coordinates: readPoint() };
            
            case 2: // LineString
                const numLinePoints = view.getUint32(offset, littleEndian);
                offset += 4;
                const linePoints = [];
                for (let i = 0; i < numLinePoints; i++) {
                    linePoints.push(readPoint());
                }
                return { type: 'LineString', coordinates: linePoints };
            
            case 3: // Polygon
                return { type: 'Polygon', coordinates: readPolygonRings() };

            case 6: // MultiPolygon
                const numPolygons = view.getUint32(offset, littleEndian);
                offset += 4;
                const polygons = [];
                for (let i = 0; i < numPolygons; i++) {
                    // Each polygon in a multipolygon has its own WKB header
                    offset++; // Skip byte order
                    offset += 4; // Skip geometry type
                    polygons.push(readPolygonRings());
                }
                return { type: 'MultiPolygon', coordinates: polygons };

            default:
                console.warn(`Unsupported WKB geometry type: ${actualGeomType}`);
                return null;
        }
    } catch (error) {
        console.error('Error parsing WKB:', error);
        return null;
    }
}

// Recursively sanitizes an object to convert BigInt values to strings for JSON compatibility.
function sanitizeProperties(properties) {
    for (const key in properties) {
        const value = properties[key];
        if (typeof value === 'bigint') {
            properties[key] = value.toString();
        } else if (typeof value === 'object' && value !== null) {
            // Recurse into nested objects if necessary (though unlikely for flat Parquet rows)
            sanitizeProperties(value);
        }
    }
    return properties;
}
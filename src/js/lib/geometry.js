/**
 * @file geometry.js
 * This module contains functions for geometric calculations related to the map,
 * including area calculation for SVG paths.
 */

// --- Scale Calculation ---

/**
 * Calculates the scale factor for converting pixels to in-game selge.
 * Based on the known distance between two points from game lore.
 * - Point A (Isthmia Great Forest): Pixel coordinates (417, 891)
 * - Point B (Lake Elm): Pixel coordinates (1071, 819)
 * - Known Lore Distance: 4,800 selge
 * @returns {number} The scale factor in selge per pixel.
 */
function calculateSelgePerPixel() {
    const pointA = { x: 417, y: 891 };
    const pointB = { x: 1071, y: 819 };
    const loreDistanceSelge = 4800;

    // Calculate the Euclidean distance in pixels
    const pixelDistance = Math.sqrt(
        Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2)
    );

    // Calculate and return the scale factor
    return loreDistanceSelge / pixelDistance;
}

// Create a singleton instance of the scale factor so it's only calculated once.
const selgePerPixel = calculateSelgePerPixel();

// --- Area Calculation ---

/**
 * Parses an SVG path data string into an array of [x, y] coordinates.
 * This implementation is simplified and assumes the path is a single polygon
 * composed of absolute 'M' (moveto) and 'L' (lineto) commands.
 * Example: "M10 10 L20 20 L30 10"
 * @param {string} pathData The SVG path data string.
 * @returns {Array<[number, number]>} An array of coordinate pairs.
 */
function parseSvgPath(pathData) {
    if (!pathData || typeof pathData !== 'string') {
        return [];
    }

    // Normalize the path data by removing command letters and splitting into pairs.
    const coordPairs = pathData.replace(/[ML]/g, ' ').trim().split(/\s+/);
    const points = [];

    for (let i = 0; i < coordPairs.length; i += 2) {
        const x = parseFloat(coordPairs[i]);
        const y = parseFloat(coordPairs[i + 1]);
        if (!isNaN(x) && !isNaN(y)) {
            points.push([x, y]);
        }
    }
    return points;
}

/**
 * Calculates the area of a polygon using the Shoelace formula.
 * @param {Array<[number, number]>} vertices An array of [x, y] coordinates for the polygon's vertices.
 * @returns {number} The area of the polygon in square units.
 */
function calculatePolygonArea(vertices) {
    let area = 0;
    const n = vertices.length;

    if (n < 3) {
        // A polygon must have at least 3 vertices.
        return 0;
    }

    for (let i = 0; i < n; i++) {
        const [x1, y1] = vertices[i];
        const [x2, y2] = vertices[(i + 1) % n]; // Get the next vertex, wrapping around.
        area += (x1 * y2 - x2 * y1);
    }

    return Math.abs(area / 2.0);
}

/**
 * Calculates the area of a region described by an SVG path.
 * @param {string} pathData The SVG path data string.
 * @returns {number} The area in square pixels.
 */
function calculateSvgPathArea(pathData) {
    const vertices = parseSvgPath(pathData);
    return calculatePolygonArea(vertices);
}

// --- Main Export ---

/**
 * Calculates the area for a given region, converts it to square selge, and formats it.
 * @param {object} region The region object, which must have an `svgPathData` property.
 * @returns {string|null} The formatted area string (e.g., "1,234,567 selge²") or null if calculation is not possible.
 */
export function calculateRegionAreaInSelge(region) {
    if (!region || !region.svgPathData) {
        return null;
    }

    // 1. Calculate the area in square pixels from the SVG path
    const areaInSquarePixels = calculateSvgPathArea(region.svgPathData);

    if (areaInSquarePixels === 0) {
        return null;
    }

    // 2. Calculate the conversion factor for area
    const squareSelgePerSquarePixel = Math.pow(selgePerPixel, 2);

    // 3. Convert the area to square selge
    const areaInSquareSelge = areaInSquarePixels * squareSelgePerSquarePixel;

    // 4. Format the number with commas and append the unit
    const formattedArea = Math.round(areaInSquareSelge).toLocaleString('en-US');

    return `~${formattedArea} selge²`;
}

/**
 * @file home.js
 * This file contains the logic for the home page of the Zemurian Atlas.
 * Its primary function is to randomly select and apply a background image.
 */

/**
 * An array of available background images for the homepage.
 * These are all located in the `/assets/backgrounds/` directory.
 */
const backgroundImages = [
    'azure.webp',
    'azure2.png',
    'azure3.png',
    'azure5.png',
    'cold-steel-ii.webp',
    'cold-steel-ii2.jpg',
    'cold-steel-iii.png',
    'cold-steel-iv.png',
    'cold-steel.jpg',
    'cold-steel2.png',
    'cold-steel3.webp',
    'cold-steel4.webp',
    'cold-steel5.png',
    'cold-steel6.png',
    'cold-steel7.jpg',
    'daybreak.webp',
    'sky-3rd.png',
    'sky-remake.png',
    'sky-sc.png',
    'sky-sc3.png',
    'sky2.png',
    'zero.webp',
];

/**
 * Initializes the home page functionality.
 * Specifically, it selects a random background image from the list
 * and sets it as the background for the `<body>` element.
 */
export function initHomePage() {
    // Select a random image from the array
    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    const selectedImage = backgroundImages[randomIndex];

    // Construct the full path to the image
    const imageUrl = `assets/backgrounds/${selectedImage}`;

    // Apply the image to the body's background-image style
    document.body.style.backgroundImage = `url('${imageUrl}')`;
}
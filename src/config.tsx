import { LocationData } from "./types";

// ============================================
// CUSTOMIZE: Edit all your text content here!
// ============================================

// Header text (shown at top of page)
export const HEADER_EMOJI = "🌍";
export const HEADER_TITLE = "Our Adventures Around the World";
export const HEADER_SUBTITLE =
  "Click markers to see our memories • Drag to pan";

// Valentine question (first screen)
export const VALENTINE_TITLE = "Will you be my Valentine,";
export const VALENTINE_TITLE_ACCENT = "Khushi?";
export const VALENTINE_IMAGE = "/images/ks1.png";
export const VALENTINE_NO_TEXT = "No";
export const VALENTINE_YES_TEXT = "Yes";

// Intro overlay (second screen - after clicking Yes)
export const INTRO_TITLE = "Our Travel Map";
export const INTRO_DESCRIPTION =
  "Explore all the special places we've visited together. Click on the heart markers to see our memories from each location!";
export const INTRO_BUTTON_TEXT = "View Map";

// Sidebar (location list)
export const SIDEBAR_TITLE = "The Itinerary";
export const SIDEBAR_PIN_EMOJI = "📍";

// Side panel (location details)
export const PANEL_GALLERY_TITLE = "Photos";
export const PANEL_NO_PHOTOS_EMOJI = "📸";
export const PANEL_NO_PHOTOS_TEXT = "No photos added yet";

// Mobile instructions
export const MOBILE_INSTRUCTIONS = "Tap markers to view";

// ============================================
// CUSTOMIZE: Add your own locations below!
// ============================================
// Each location needs: id, name, coords [lat, lng], date, story, images array, and type
export const LOCATIONS: LocationData[] = [
  {
    id: "seattle",
    name: "Seattle, Washington",
    coords: [47.6062, -122.3321],
    date: "",
    story: "",
    images: [
      "/images/seattle1.jpg",
      "/images/seattle2.JPG",
      "/images/seattle3.JPG",
      "/images/seattle4.JPG",
      "/images/settle5.JPG",
      "/images/seattle6.JPG",
      "/images/seattle7.JPG",
      "/images/seattle8.JPG",
      "/images/seattle9.JPG",
      "/images/seattle10.JPG",
      "/images/seattle11.JPG",
      "/images/seattle12.jpg",
      "/images/seattle13.JPG",
      "/images/seattle14.JPG",
    ],
  },
  {
    id: "sammamish",
    name: "Sammamish, Washington",
    coords: [47.6163, -122.0356],
    date: "",
    story: "",
    images: [
      "/images/sammamish1.JPG",
      "/images/sammamish2.JPG",
      "/images/sammamish3.jpg",
      "/images/sammamish4.jpg",
      "/images/sammamish5.JPG",
      "/images/sammamish6.jpg",
      "/images/sammamish7.JPG",
      "/images/sammamish8.PNG",
      "/images/sammamish9.PNG",
      "/images/sammamish10.jpg",
      "/images/sammamish11.JPG",
    ],
  },
  {
    id: "irvine",
    name: "Irvine, California",
    coords: [33.6846, -117.8265],
    date: "",
    story: "",
    images: [
      "/images/irvine1.jpg",
      "/images/irvine2.jpg",
      "/images/irvine3.JPG",
      "/images/irvine4.jpg",
      "/images/irvine5.jpg",
      "/images/irvine6.jpg",
      "/images/irvine7.jpg",
      "/images/irvine9.JPG",
      "/images/irvine10.JPG",
      "/images/irvine11.JPG",
      "/images/irvine12.jpg",
    ],
  },
  {
    id: "greece",
    name: "Greece",
    coords: [37.9838, 23.7275],
    date: "",
    story: "",
    images: [
      "/images/greece1.JPG",
      "/images/greece2.jpg",
      "/images/greece3.JPG",
      "/images/greece4.jpg",
      "/images/greece5.JPG",
    ],
  },
  {
    id: "hawaii",
    name: "Hawaii",
    coords: [21.3069, -157.8583],
    date: "",
    story: "",
    images: [],
  },
  {
    id: "vancouver",
    name: "Vancouver, Canada",
    coords: [49.2827, -123.1207],
    date: "",
    story: "",
    images: [
      "/images/vancouver1.jpg",
      "/images/vancouver2.jpg",
      "/images/vancouver3.JPG",
      "/images/vancouver4.JPG",
      "/images/vancouver5.JPG",
      "/images/vancouver6.jpg",
    ],
  },
  {
    id: "bay-area",
    name: "Bay Area, California",
    coords: [37.5485, -122.0590],
    date: "",
    story: "",
    images: [
      "/images/bay1.JPG",
      "/images/bay2.jpg",
      "/images/bay3.JPG",
      "/images/bay4.JPG",
      "/images/bay5.JPG",
    ],
  },
];

// ============================================
// COMING SOON: Color customization
// ============================================
// Future versions will support:
// - ACCENT_COLOR: Change the pink theme to any color
// - BACKGROUND_COLOR: Customize the app background

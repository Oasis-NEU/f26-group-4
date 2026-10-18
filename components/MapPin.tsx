
// Imports useState to track whether the location preview is open
import { useState } from "react";

// Imports the Map type the types file
import type { Map as MapData } from "../types";

// Defines the information that MapPin receives
type MapPinProps = {
  location: MapData; // Contains the information for one map location
};

// MapPin component
export default function MapPin({ location }: MapPinProps) {

  // Tracks whether the location preview is visible, starts as false so the preview is hidden
  const [showPreview, setShowPreview] = useState(false);

  // If the location is not pinned, nothing is displayed
  if (!location.isPinned) {
    return null;
  }

  return (
    // Main container for the map pin and its preview
    <div className="map-pin">

      {/* Button representing the location pin */}
      <button
        type="button"
        // Opens or closes the preview when the pin is clicked
        onClick={() => setShowPreview((prev) => !prev)}
        aria-label={`View ${location.locationName}`}
      >
        📍
      </button>

      {/* Only displays the preview when showPreview is true */}
      {showPreview && (
        <div className="map-preview">

          {/* Displays the location name */}
          <h3>{location.locationName}</h3>

          {/* Displays the location's preview image */}
          <img
            src={location.previewImage}
            alt={location.locationName}
            width={200}
          />

          {/* Displays the location's geotag */}
          <p>{location.geotag}</p>

          {/* Button to close the location preview */}
          <button
            type="button"
            onClick={() => setShowPreview(false)}
          >
            Close
          </button>

        </div>
      )}

    </div>
  );
}

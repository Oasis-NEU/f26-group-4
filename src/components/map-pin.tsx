// Imports useState to track whether the location preview is open
// useState is a "hook" that lets a component remember a value that can change
// When the value changes, the component re-renders to show the update (used to remember whether the preview is open)
import { useState } from "react";

// Imports react native's building blocks
  // View: a generic container, like <div>
  // Text: all text must go inside this
  // Pressable: anything tappable, like a button
  // StyleSheet: a helper for writing styles (replacing CSS)
  // Image: displays a picture
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

// Imports the Map type from the types file
import type { Map as MapData } from "../../types";

// Information MapPin receives, MapPin must be given one thing, a location of type MapData
type MapPinProps = {
  location: MapData; // Contains the information for one map location
};

// MapPin component
// A react component is a function that returns UI
// { location } pulls the prop out of the inputs, and export default lets other files import it
export default function MapPin({ location }: MapPinProps) {
  
  // Const = declaring a variable that cannot be assigned a new value
  // Tracks whether the location preview is visible, starts as false so the preview is hidden
    // showPreview is the current value (true or false).
      // showPreview is never changed directly, you call the setter and React re-renders it with the new value
    // setShowPreview is the function that changes it.
  const [showPreview, setShowPreview] = useState(false);

  // If the location is not pinned, the component returns null, so nothing is displayed
  if (!location.isPinned) {
    return null;
  }

  return (
    // Main container for the map pin and its preview
    <View style={styles.mapPin}>

      {/* Pressable representing the location pin */}
      <Pressable
        // onPress runs when tapped. It flips showPreview: prev is the old value and !prev is the opposite
        onPress={() => setShowPreview((prev) => !prev)}
        // accessibilityRole="button" tells screen readers this is a button
        accessibilityRole="button"
        // accessibilityLabel is what a screen reader says out loud, the backticks and ${...} build a string with the location name inserted, like "View Eiffel Tower"
        accessibilityLabel={`View ${location.locationName}`}
      
        // The emoji sits inside a Text, because all visible content must
      >
        <Text style={styles.pin}>📍</Text>
      </Pressable>

      {/* Only displays the preview when showPreview is true (&&)*/}
      {showPreview && (
        <View style={styles.mapPreview}>

          {/* Displays the location name */}
          <Text style={styles.locationName}>{location.locationName}</Text>

          {/* Displays the location's preview image */}
          <Image
            // For images loaded from the internet, you pass an object with a uri property
            source={{ uri: location.previewImage }}
            // React Native’s version of alt text, what is displayed if there is no image
            accessibilityLabel={location.locationName}
            // Remote images must have a width and height in their style, handled below
            style={styles.previewImage}
          />

          {/* Displays the location's geotag */}
          <Text>{location.geotag}</Text>

          {/* Pressable to close the location preview, always sets the value to false, instead of toggling from true -> false */}
          <Pressable
            onPress={() => setShowPreview(false)}
            accessibilityRole="button"
          >
            <Text style={styles.closeText}>Close</Text>
          </Pressable>

        </View>
      )}

    </View>
  );
}

// Styles replace CSS 
const styles = StyleSheet.create({
  mapPin: {
    alignItems: "center",
  },
  pin: {
    fontSize: 24,
  },
  mapPreview: {
    padding: 12,
    gap: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  locationName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 4,
  },
  closeText: {
    color: "#007AFF",
    fontWeight: "600",
  },
});

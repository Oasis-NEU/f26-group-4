// Imports react native's building blocks
  // Pressable: anything tappable, like a button
  // StyleSheet: a helper for writing styles (replacing CSS)
  // Text: all text must go inside this
import { Pressable, StyleSheet, Text } from "react-native";

// Information PlaceTag receives
// Means PlaceTagProps must be given three things: a location name(string), a geotag(string), and a function the parent provides
    //(geotag: string) => void means a function that takes a string and returns nothing
type PlaceTagProps = {
  locationName: string;
  geotag: string;
  onClick: (geotag: string) => void; // Function is called when pressed
};

// PlaceTag component
// A React component is a function that returns a UI
// { locationName, geotag, onClick } part pulls those three props out of the inputs so you can use them by name
// : PlaceTagProps tells TypeScript what shape to expect, export default lets other files import it
export default function PlaceTag({
    locationName,
    geotag,
    onClick
}: PlaceTagProps){

    // Everything inside return is the UI, or what appears on the screen
    return (
        // Displays the location button
        <Pressable
        // Means when tapped, run this function, which calls the onClick the parent gave you and passes along this tag’s geotag
        // The () => wrapper is needed so the call happens when the button is pressed, not immediately when the component renders
        onPress={() => onClick(geotag)}

        //Tells screen readers to announce this as a button
        accessibilityRole="button"

        //Shows the location name, styles.text applies the style from below
        >
         <Text style={styles.text}>{locationName}</Text>
        </Pressable>
    );
}

// Styles replace CSS
const styles = StyleSheet.create({
    text: {
        color: "#007AFF",
        fontWeight: "600",
    },
});

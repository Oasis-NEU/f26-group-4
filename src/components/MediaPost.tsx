// Imports useState to track which image is displayed
// useState is a "hook" that lets a component remember a value that can change
// When the value changes, the component re-renders to show the update (used to remember which image is showing)
import { useState } from "react";

// Imports react native's building blocks
  // View: a generic container, like <div>
  // Text: all text must go inside this
  // Pressable: anything tappable, like a button
  // StyleSheet: a helper for writing styles (replacing CSS)
  // Image: displays a picture
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

// Imports the Media type from the types file
import type { Media } from "../../types";

// Information the MediaPost component receives, MediaPost must be given one thing, an array of Media
type MediaPostProps = {
    media: Media[] //An array of images and their captions
};

// MediaPost component
// A React component is a function that returns a UI
// { media } pulls the prop out of the inputs, and export default lets other files import it
export default function MediaPost({
    media
}: MediaPostProps) {
    // Tracks the index of the currently displayed image
        // currentIndex is the position of the image being shown
            // currentIndex is never changed directly, you call the setter and React re-renders it with the new value
        // Arrays start counting at 0, so 0 is the first image, 0 is the starting value so the first image shows fits
        // setCurrentIndex is the function that changes it
    const [currentIndex, setCurrentIndex] = useState(0);

    // Navigation function, moves forward one image
    // prev is the old index, and prev + 1 is the next one
    const nextImage = () => {
        setCurrentIndex((prev) =>
        // The % is the modulo operator, which gives the remainder after division, making the carousel wrap around
        (prev + 1) % media.length
        );
    };

    // Navigation function, moves backward one image
    const previousImage = () => {
        setCurrentIndex((prev) =>
        // Adding the length first makes it (−1 + 3) % 3 = 2, the last image
        (prev - 1 + media.length) % media.length
        );
    };
    
    // Everything inside return is the UI, or what appears on the screen
    return (
        // Container for the images and navigation buttons
        <View style={styles.mediaPost}>

            {/* Displays the currently selected image */}
            {/*media[currentIndex] grabs the item at the current position in the array, and .imgURL gets its image address
            source={{ uri: ... }}: for images from the internet, you pass an object with a uri
            accessibilityLabel is React Native’s version of alt text*/}
            <Image
            source={{ uri: media[currentIndex].imgURL }}
            accessibilityLabel={media[currentIndex].caption}
            style={styles.image}
            />

            {/* Displays the caption for the current image*/}
            <Text>{media[currentIndex].caption}</Text>

            {/* Only shows navigation if there are multiple images (&&)
            If there’s only one image, there’s nothing to flip through, so the buttons are hidden*/}
            {media.length > 1 && (
                <View style={styles.navigation}>

                    {/* Button to display the previous image */}
                    {/* onPress={previousImage} passes the function itself, so it runs when tapped rather than immediately*/}
                    <Pressable onPress={previousImage} accessibilityRole="button">
                        <Text style={styles.navText}>Previous</Text>
                    </Pressable>

                    {/* Displays the current image number and total*/}
                    {/* Counts the images, adds 1 to the index so index 0 displays as “1 / 3”*/}
                    <Text>
                        {currentIndex + 1} / {media.length}
                    </Text>

                    {/* Button to display the next image */}
                    {/* Works the same way as Previous, but calls nextImage */}
                    <Pressable onPress={nextImage} accessibilityRole="button">
                        <Text style={styles.navText}>Next</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

// Styles replace CSS
const styles = StyleSheet.create({
    mediaPost: {
        alignItems: "center",
        gap: 8,
    },
    image: {
        width: 300,
        height: 300,
    },
    navigation: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    navText: {
        color: "#007AFF",
        fontWeight: "600",
    },
});

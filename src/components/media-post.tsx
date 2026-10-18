// Imports useState to track which image is displayed
import { useState } from "react";

// Imports the Media type from the types file
import type { Media } from "../../types";
import {Button, Text, View} from "react-native";
import {Image} from "expo-image";

// Information the MediaPost component recieves
type MediaPostProps = {
    media: Media[] //An array of images and their captions
};

// MediaPost component
export default function MediaPost({
    media
}: MediaPostProps) {
    // Tracks the index of the currently displayed image, starts at 0
    const [currentIndex, setCurrentIndex] = useState(0);

    // Moves to the next image
    const nextImage = () => {
        setCurrentIndex((prev) =>
        (prev + 1) % media.length
        );
    };

    // Moves to the previous image
    const previousImage = () => {
        setCurrentIndex((prev) =>
        (prev - 1 + media.length) % media.length
        );
    };

    return (
        //Container for the images and navigation buttons
        <View>

            {/* Displays the currently selected image */}
            <Image
                source={media[currentIndex].imgURL}
                alt={media[currentIndex].caption}
                style={{width: 300, height: 300}}
            />

            {/* Displays the caption for the current image*/}
            <Text>{media[currentIndex].caption}</Text>

            {/* Only shows navigation if there are multiple images */}
            {media.length > 1 && (
                <View>

                    {/* Button to display the previous image */}
                    <Button onPress={previousImage} title={"Previous"}>
                    </Button>

                    {/* Displays the current image number and total*/}
                    <Text>
                        {currentIndex + 1} / {media.length}
                    </Text>

                    {/* Button to display the next image */}
                    <Button onPress={nextImage} title={"Next"}>
                    </Button>
                    </View>
            )}
        </View>
    );
}

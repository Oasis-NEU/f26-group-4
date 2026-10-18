// Imports useState to track which image is displayed
import { useState } from "react";

// Imports the Media type from the types file
import type { Media } from "../types";

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
        <div className="media-post">

            {/* Displays the currently selected image */}
            <img
            src={media[currentIndex].imgURL}
            alt={media[currentIndex].caption}
            width={300}
            />

            {/* Displays the caption for the current image*/}
            <p>{media[currentIndex].caption}</p>

            {/* Only shows navigation if there are multiple images */}
            {media.length > 1 && (
                <div>

                    {/* Button to display the previous image */}
                    <button type="button" onClick={previousImage}>
                        Previous
                    </button>

                    {/* Displays the current image number and total*/}
                    <span>
                        {currentIndex + 1} / {media.length}
                    </span>

                    {/* Button to display the next image */}
                    <button type="button" onClick={nextImage}>
                        Next
                    </button>
                    </div>
            )}
        </div>
    );
}

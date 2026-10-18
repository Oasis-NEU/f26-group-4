import {Place} from '@/types/place';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Image} from "expo-image";
import {useState} from "react";
import MediaPost from "@/components/media-post";

type PlaceDetailsProps = {
    place: Place; // the place type
    /* MediaPost: MediaPost; // the MediaPost type (needs to be defined)
    SaveButton: SaveButton; // is this built into the operating system? if not, we need to define it
    ShareButton: ShareButton; //is this built into the operating system? if not, we need to define it
    BackButton: BackButton; // is this built into the operating system? if not, we need to define it
    AddReview: AddReview; // the AddReview type (needs to be defined) */
};

// We haven't yet discussed when components' data comes from its parent and when it comes from a "useContext" hook
// Don't worry too much about how we get the data, we're more interested in what data it needs in order to display the relevant information
export function PlaceDetails({place}: PlaceDetailsProps) {

    const [isBookmarked, setIsBookmarked] = useState(false)


    function handleBookmark() {
        setIsBookmarked(prevState => !prevState);
    }


    return(
        <View style={styles.container} >
            <View>

            </View>
            <Image source={place.coverImage} style={styles.coverImage} />
            {/*<Button title={"Bookmark"} onPress={handleBookmark}   />*/}

            <Pressable onPress={handleBookmark} style={[styles.bookmark, isBookmarked && styles.bookmarkFilled]} />

            {/* not sure how to display cover image */}
            <View style={styles.contentHeader}>
                <Text style={styles.title}>{place.name}</Text>
                <View style={styles.ratingContainer}>
                    <Image style={styles.starImage} source={"https://images.rawpixel.com/image_png_200/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTEwL3JtNDY3YmF0Y2gyLXN0YXItMDAxXzEucG5n.png%20200w,%20https://images.rawpixel.com/image_png_400/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTEwL3JtNDY3YmF0Y2gyLXN0YXItMDAxXzEucG5n.png%20400w,%20https://images.rawpixel.com/image_png_600/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTEwL3JtNDY3YmF0Y2gyLXN0YXItMDAxXzEucG5n.png%20600w,%20https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTEwL3JtNDY3YmF0Y2gyLXN0YXItMDAxXzEucG5n.png%201600w,%20https://images.rawpixel.com/image_png_1100/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTEwL3JtNDY3YmF0Y2gyLXN0YXItMDAxXzEucG5n.png%202400w,%20https://images.rawpixel.com/image_png_1300/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTEwL3JtNDY3YmF0Y2gyLXN0YXItMDAxXzEucG5n.png%203000w"} />
                </View>
            </View>
            <Text>{place.averageRating}</Text>
            <Text>{place.friendsRating}</Text>
            <Text>{place.suitedFor}</Text>
            <Text>{place.placeType}</Text>
            <Text>{place.city}, {place.country}</Text>
            {/* not sure how to display MediaPost */}
            {/* also not sure how to display the buttons (SaveButton, ShareButton, BackButton, AddReview) */}
            <Text>{place.description}</Text>

            <View style={styles.placeContent}>
                {place.reviews?.map(singleReview =>
                    <MediaPost media={singleReview.media}/>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        height: "100%"
    },
    coverImage: {
        width: "100%",
        height: 400
    },
    contentHeader: {
        display: "flex",
        flexDirection: "row",
        gap: 20
    },
    title: {
        fontSize: 30,
    },
    ratingContainer: {
        flex: 1
    },
    starImage: {
        width: 20,
        height: 20
    },
    bookmark: {
        width: 40,
        height: 40,
        backgroundColor: "blue",
        borderRadius: "50%"
    },
    bookmarkFilled: {
        backgroundColor: "red"
    },
    placeContent: {

    }
});

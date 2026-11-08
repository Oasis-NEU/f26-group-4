// Imports useState to track whether the post is bookmarked
// useState is a "hook" that lets a component remember a value that can change
// When the value changes, the component re-renders to show the update (used below to show whether the post is bookmarked)
import { useState } from "react";

// Imports react native's building blocks
  // View: a generic container, like <div>
  // Text: all text must go inside this
  // Pressable: anything tappable, like a button
  // StyleSheet: a helper for writing styles (replacing CSS)
  // Linking: allows the app to open URLs in the browser
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

// Imports the Post type from types.ts
import type { Post } from "../../types";

// Imports MediaPost and PlaceTag components
import MediaPost from "./media-post";
import PlaceTag from "./place-tag";

// Information that FeedItem receives, FeedItem must be given one thing, of type Post
// "Props" are the input that a component receives from its parent
type FeedItemProps = {
  post: Post; // Contains all the information for one post
};

// FeedItem component
// A React component is a function that returns a UI
// The { post } pulls the post prop out of the input and export default lets other files import it
export default function FeedItem({ post }: FeedItemProps) {

  // Const = declaring a variable that cannot be assigned a new value
  // Tracks whether the post is bookmarked
  // isBookmarked is the current state of the value -> true/false
    // isBookmarked is never changed directly, you call the setter and React re-renders it with the new value
  // setIsBookmarked is the function you call to change it
  // post.bookmark is the starting value
  const [isBookmarked, setIsBookmarked] = useState(
    post.bookmark
  );

  // Counts the total number of individual comments through a loop
  // reduce loops through the groups of comments and adds up a running total
    // Begins at 0, and for each group it adds that group’s number of comments. The result is the total across all groups.
  const commentCount = post.comments.reduce(
    (total, group) => total + group.comments.length,
    0
  );

  // Everything inside return is the UI, or what appears on the screen
  return (
    // Main container for one travel post, styled with styles.feedItem (defined at the bottom)
    <View style={styles.feedItem}>

      {/* Displays the username of the person who posted */}
      <Text style={styles.username}>{post.username}</Text>

      {/* Displays the clickable location name */}
      {/* Uses the PlaceTag component, passing it data as props*/}
      {/*onClick is a function that PlaceTag will call when tapped*/}
      <PlaceTag
        locationName={post.locationName}
        geotag={post.geotag}
        onClick={(geotag) => {
          // Temporary action until map navigation is implemented, for now there is just a placeholder
          console.log("Location clicked:", geotag);
        }}
      />

      {/* Displays the images and their captions, gives the media to the MediaPost component to display */}
      <MediaPost media={post.media} />

      {/* Displays the written travel review */}
      <Text>{post.writtenReview}</Text>

      {/* Displays the rating out of five */}
      <Text>Rating: {post.rating}/5</Text>

      {/* Displays the number of likes */}
      <Text>{post.likes} likes</Text>

      {/* Displays the total number of comments */}
      <Text>{commentCount} comments</Text>

      {/* Button to save or unsave the post */}
      {/*onPress runs when the user taps, flipping the bookmark: prev is the old value, and !prev is its opposite
      accessibilityRole="button" tells screen readers to announce this as a button.*/}
      <Pressable
        onPress={() => setIsBookmarked((prev) => !prev)}
        accessibilityRole="button"
      >
        {/* Changes the button text depending on bookmark status */}
        <Text style={styles.link}>{isBookmarked ? "Saved" : "Save"}</Text>
      </Pressable>

      {/* Only displays the booking link if one exists */} 
      {/* The && means only render this if post.bookingLink exists, if it’s missing, nothing shows. 
      When tapped, Linking.openURL opens the URL in the phone’s browser.*/}
      {post.bookingLink && (
        <Pressable
          // Opens the booking link in the device's browser
          onPress={() => Linking.openURL(post.bookingLink)}
          accessibilityRole="link"
        >
          <Text style={styles.link}>Book Here</Text>
        </Pressable>
      )}

    </View>
  );
}

// Styles replace CSS
const styles = StyleSheet.create({
  feedItem: {
    padding: 12,
    gap: 8,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    color: "#007AFF",
    fontWeight: "600",
  },
});

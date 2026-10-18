// Imports useState to track whether the post is bookmarked
import { useState } from "react";

// Imports the Post type from types.ts
import type { Post } from "../types";

// Imports MediaPost and PlaceTag components
import MediaPost from "./MediaPost";
import PlaceTag from "./PlaceTag";

// Information that FeedItem receives
type FeedItemProps = {
  post: Post; // Contains all the information for one post
};

// FeedItem component
export default function FeedItem({ post }: FeedItemProps) {

  // Tracks whether the post is bookmarked
  const [isBookmarked, setIsBookmarked] = useState(
    post.bookmark
  );

  // Counts the total number of individual comments
  const commentCount = post.comments.reduce(
    (total, group) => total + group.comments.length,
    0
  );

  return (
    // Main container for one travel post
    <article className="feed-item">

      {/* Displays the username of the person who posted */}
      <h3>{post.username}</h3>

      {/* Displays the clickable location name */}
      <PlaceTag
        locationName={post.locationName}
        geotag={post.geotag}
        onClick={(geotag) => {
          // Temporary action until map navigation is implemented
          console.log("Location clicked:", geotag);
        }}
      />

      {/* Displays the images and their captions */}
      <MediaPost media={post.media} />

      {/* Displays the written travel review */}
      <p>{post.writtenReview}</p>

      {/* Displays the rating out of five */}
      <p>Rating: {post.rating}/5</p>

      {/* Displays the number of likes */}
      <p>{post.likes} likes</p>

      {/* Displays the total number of comments */}
      <p>{commentCount} comments</p>

      {/* Button to save or unsave the post */}
      <button
        type="button"
        onClick={() => setIsBookmarked((prev) => !prev)}
      >
        {/* Changes the button text depending on bookmark status */}
        {isBookmarked ? "Saved" : "Save"}
      </button>

      {/* Only displays the booking link if one exists */}
      {post.bookingLink && (
        <a
          href={post.bookingLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Book Here
        </a>
      )}

    </article>
  );
}
import { Image } from 'expo-image';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';

// Shows the "places traveled/rated" section of a profile: a list of places
// this user has posted about, with the place name and the rating they gave it.
//
// NOTE: neither `place.ts` nor `review.ts` currently has a `name`/`placeName`
// field, so there's no existing type that already has everything this list
// needs to display. This component defines its own small shape (below)
// for what it needs to be handed; whichever screen renders this component
// is responsible for looking up each post's place name and combining it
// with the review before passing it in. Flag this gap with the team.

export type ProfilePostSummary = {
  id: string; // the review's id
  placeName: string;
  rating: number;
  thumbnail?: string; // a photo to represent this post, if there is one
};

type ProfilePostsProps = {
  posts: ProfilePostSummary[];
  onPostPress?: (postId: string) => void;
};

export function ProfilePosts({ posts, onPostPress }: ProfilePostsProps) {
  return (
    <FlatList
      data={posts}
      numColumns={3}
      keyExtractor={(post) => post.id}
      renderItem={({ item }) => (
        <Pressable style={styles.tile} onPress={() => onPostPress?.(item.id)}>
          {item.thumbnail && <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />}
          <Text numberOfLines={1}>{item.placeName}</Text>
          <Text>{item.rating} ★</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1 / 3,
    padding: 4,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 4,
  },
});

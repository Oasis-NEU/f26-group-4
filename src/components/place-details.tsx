import { Place } from '@/types/place';
import { StyleSheet, Text, View } from 'react-native';

// Template for new components. Don't edit this file; copy it:
// 1. Copy this file and rename the copy, e.g. feed-item.tsx
// 2. Rename TemplateComponent and TemplateComponentProps, e.g. FeedItem and FeedItemProps
// 3. Replace the example props with the data your component needs
// 4. Use it in a screen: import { FeedItem } from '@/components/feed-item';

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
export function PlaceDetails({place}: PlaceDetailsProps) { //Add later: MediaPost, SaveButton, ShareButton, BackButton, AddReview}: PlaceDetailsProps//
    // More global data such as a `User` object will be controlled by its own hook
    // Data that is processed more locally is passed as a prop.
    // For example, we might get the user data from
  return(
    <View style={styles.container} >
      {/* not sure how to display cover image */}
      <Text>{place.name}</Text>
      <Text>{place.averageRating}</Text>
      <Text>{place.friendsRating}</Text>
      <Text>{place.suitedFor}</Text>
      <Text>{place.placeType}</Text>
      <Text>{place.city}, {place.country}</Text>
      {/* not sure how to display MediaPost */}
      {/* also not sure how to display the buttons (SaveButton, ShareButton, BackButton, AddReview) */}
      <Text>{place.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});

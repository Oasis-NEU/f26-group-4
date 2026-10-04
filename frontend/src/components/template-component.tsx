import { StyleSheet, View } from 'react-native';

// Template for new components. Don't edit this file; copy it:
// 1. Copy this file and rename the copy, e.g. feed-item.tsx
// 2. Rename TemplateComponent and TemplateComponentProps, e.g. FeedItem and FeedItemProps
// 3. Replace the example props with the data your component needs
// 4. Use it in a screen: import { FeedItem } from '@/components/feed-item';

type TemplateComponentProps = {
  title: string; // required prop
  onPress?: () => void; // optional prop (the ? means it can be left out and the component handles it gracefully)
    // The `() => void` means that it's a function that takes nothing and returns nothing.
};

// We haven't yet discussed when components' data comes from its parent and when it comes from a "useContext" hook
// Don't worry too much about how we get the data, we're more interested in what data it needs in order to display the relevant information
export function TemplateComponent({ title, onPress }: TemplateComponentProps) {
    // More global data such as a `User` object will be controlled by its own hook
    // Data that is processed more locally is passed as a prop.
    // For example, we might get the user data from

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {},
});

export type OnboardingFields = {
  // Two-letter country code, like "US".
  homeCountry?: string;

  // Selected range, like "25–34".
  ageRange?: string;

  // Address of the selected profile photo.
  profilePicture?: string;

  // Destination the person typed.
  nextTrip?: string;

  // Interests typed by the person, saved as a list.
  interests?: string[];
};
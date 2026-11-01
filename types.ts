export type Post = {
  username: string;
  userID: number;
  locationName: string;
  geotag: string;
  writtenReview: string;
  rating: number; // Number from 1 through 5.
  media: Media[];
  bookmark: boolean;
  bookingLink: string;
  likes: number;
  comments: Comments[];
};

export type Map = {
  locationName: string;
  geotag: string;
  isPinned: boolean;
  previewImage: string;
  userID: number;
};

export type EditProfile = {
  name: string;
  username: string;
  profilePicture: string;
  homeLocation: string;
  currentLocation: string;
  interests: string[];
  deletePosts: Post[];
};

export type Media = {
  // Address of the selected photo or video.
  imgURL: string;

  // Text describing this photo or video.
  caption: string;

  // Optional: identifies a photo or video.
  // Our upload preview will treat a missing type as a photo.
  type?: 'photo' | 'video';
};

export type Comments = {
  comments: String[];
  likes: number;
};
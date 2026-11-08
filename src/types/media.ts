// One photo or video. A place or a review can have several, so they get stored
// in an array, e.g. `media: Media[]`

//I'm not sure if this has been done already in another way

export type Media = {
  type: 'photo' | 'video'; // must be one of these two exact values
  url: string; // where the photo or video lives
  caption?: string; // optional; some media won't have a caption
};

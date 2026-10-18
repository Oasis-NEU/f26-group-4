export type Post = {

    username: string;
    userID: number;
    locationName: string;
    geotag: string;
    writtenReview: string;
    rating: number; //number 1 through 5
    media: Media[]; // an array of images, used to store multiple image URL's
    bookmark: boolean;
    bookingLink: string;
    likes: number;
    comments: Comments[]; 
}

export type Map = {
    locationName: string;
    geotag: string;
    isPinned: boolean;
    previewImage: string; // URL of the preview image
    userID: number; // user ID of the user who posted it
}

export type EditProfile = {
    name: string;
    username: string;
    profilePicture: string;
    homeLocation: string;
    currentLocation: string;
    interests: string[];
    deletePosts: Post[]; // a list of their posts that they can delete
}

export type Media = {
    imgURL: string;
    caption: string;
}

export type Comments = {
    comments: String[]
    likes: number;
}


// A comment on a review. Comments belong to reviews, not places: a Feed card's
// comments are on the review it shows, the same one its heart likes
// (docs/backend-plan.md, open decision 4).
export type Comment = {
  id: string;
  reviewId: string;
  authorId: string;
  author: string; // the author's username, to show
  text: string;
  createdAt: string; // when it was posted, as an ISO timestamp
};

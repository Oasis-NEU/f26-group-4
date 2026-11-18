// Comments on reviews (docs/backend-plan.md, open decision 4). Row level
// security decides who sees what: comments on reviews you can see, minus the
// ones by people who blocked you. So nothing here filters.
import { supabase } from '@/lib/supabase';

import type { Comment } from '@/types/comment';

// A comment with its author's username.
const COMMENT_SELECT =
  'id, review_id, author_id, body, created_at, author:profiles!review_comments_author_id_fkey(username)';

type CommentRow = {
  id: string;
  review_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: { username: string } | null;
};

function toComment(row: CommentRow): Comment {
  return {
    id: row.id,
    reviewId: row.review_id,
    authorId: row.author_id,
    author: row.author?.username ?? 'someone',
    text: row.body,
    createdAt: row.created_at,
  };
}

// Every comment on one review, newest first.
export async function getComments(reviewId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('review_comments')
    .select(COMMENT_SELECT)
    .eq('review_id', reviewId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(toComment);
}

// Posts a comment as the signed-in user, and gives back the saved comment.
// author_id fills itself in from the session. The database refuses a comment
// that's empty or longer than 1,000 characters.
export async function postComment(reviewId: string, text: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('review_comments')
    .insert({ review_id: reviewId, body: text.trim() })
    .select(COMMENT_SELECT)
    .single();
  if (error) throw error;
  return toComment(data);
}

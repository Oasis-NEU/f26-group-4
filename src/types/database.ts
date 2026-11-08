
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "blocks": {
                  Row: {
                    "blocked_id": string,"blocker_id": string,"created_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "blocked_id": string,"blocker_id"?: string,"created_at"?: string
                  }
                  Update: {
                    "blocked_id"?: string,"blocker_id"?: string,"created_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "blocks_blocked_id_fkey"
      columns: ["blocked_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "blocks_blocker_id_fkey"
      columns: ["blocker_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"cities": {
                  Row: {
                    "country": string,"country_code": string | null,"cover_path": string | null,"created_at": string,"created_by": string | null,"id": string,"latitude": number | null,"longitude": number | null,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "country": string,"country_code"?: string | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"id": string,"latitude"?: number | null,"longitude"?: number | null,"name": string
                  }
                  Update: {
                    "country"?: string,"country_code"?: string | null,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"id"?: string,"latitude"?: number | null,"longitude"?: number | null,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cities_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"close_friends": {
                  Row: {
                    "created_at": string,"friend_id": string,"owner_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"friend_id": string,"owner_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"friend_id"?: string,"owner_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "close_friends_friend_id_fkey"
      columns: ["friend_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "close_friends_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"collection_places": {
                  Row: {
                    "added_at": string,"collection_id": string,"place_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "added_at"?: string,"collection_id": string,"place_id": string
                  }
                  Update: {
                    "added_at"?: string,"collection_id"?: string,"place_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "collection_places_collection_id_fkey"
      columns: ["collection_id"]
isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collection_places_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"collections": {
                  Row: {
                    "cover_path": string | null,"created_at": string,"emoji": string | null,"id": string,"is_private": boolean | null,"name": string,"owner_id": string,"parent_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_path"?: string | null,"created_at"?: string,"emoji"?: string | null,"id"?: string,"is_private"?: boolean | null,"name": string,"owner_id"?: string,"parent_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "cover_path"?: string | null,"created_at"?: string,"emoji"?: string | null,"id"?: string,"is_private"?: boolean | null,"name"?: string,"owner_id"?: string,"parent_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "collections_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collections_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    }
                  ]
                },"follow_requests": {
                  Row: {
                    "created_at": string,"from_id": string,"to_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"from_id"?: string,"to_id": string
                  }
                  Update: {
                    "created_at"?: string,"from_id"?: string,"to_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "follow_requests_from_id_fkey"
      columns: ["from_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follow_requests_to_id_fkey"
      columns: ["to_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"follows": {
                  Row: {
                    "created_at": string,"follower_id": string,"following_id": string,"notify_posts": boolean,"notify_status": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"follower_id"?: string,"following_id": string,"notify_posts"?: boolean,"notify_status"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"follower_id"?: string,"following_id"?: string,"notify_posts"?: boolean,"notify_status"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "follows_follower_id_fkey"
      columns: ["follower_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "follows_following_id_fkey"
      columns: ["following_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"interests": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"is_starter": boolean,"name": string,"slug": string,"user_count": number | null
                  }
                  ComputedFields: "user_count"
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"is_starter"?: boolean,"name": string,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"is_starter"?: boolean,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "interests_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"place_types": {
                  Row: {
                    "category": string,"created_at": string,"label": string,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string,"created_at"?: string,"label": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"label"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"places": {
                  Row: {
                    "address": string,"ai_summary": string | null,"city_id": string,"cover_path": string | null,"created_at": string,"created_by": string | null,"description": string | null,"id": string,"is_verified": boolean,"latitude": number | null,"longitude": number | null,"name": string,"place_type": string,"suited_for": (string)[],"website": string | null,"average_rating": number | null,"friends_rating": number | null,"review_count": number | null
                  }
                  ComputedFields: "average_rating" | "friends_rating" | "review_count"
                  Insert: {
                    "address"?: string,"ai_summary"?: string | null,"city_id": string,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_verified"?: boolean,"latitude"?: number | null,"longitude"?: number | null,"name": string,"place_type": string,"suited_for"?: (string)[],"website"?: string | null
                  }
                  Update: {
                    "address"?: string,"ai_summary"?: string | null,"city_id"?: string,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"id"?: string,"is_verified"?: boolean,"latitude"?: number | null,"longitude"?: number | null,"name"?: string,"place_type"?: string,"suited_for"?: (string)[],"website"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "places_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "places_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "city_stats"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "places_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "places_place_type_fkey"
      columns: ["place_type"]
isOneToOne: false
      referencedRelation: "place_types"
      referencedColumns: ["slug"]
    }
                  ]
                },"profile_interests": {
                  Row: {
                    "created_at": string,"interest_id": string,"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"interest_id": string,"profile_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"interest_id"?: string,"profile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_interests_interest_id_fkey"
      columns: ["interest_id"]
isOneToOne: false
      referencedRelation: "interests"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_interests_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_locations": {
                  Row: {
                    "home_city_id": string | null,"share_close_friends": string,"share_everyone": string,"status_city_id": string | null,"status_kind": string,"status_month": string | null,"status_until": string | null,"status_updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "home_city_id"?: string | null,"share_close_friends"?: string,"share_everyone"?: string,"status_city_id"?: string | null,"status_kind"?: string,"status_month"?: string | null,"status_until"?: string | null,"status_updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "home_city_id"?: string | null,"share_close_friends"?: string,"share_everyone"?: string,"status_city_id"?: string | null,"status_kind"?: string,"status_month"?: string | null,"status_until"?: string | null,"status_updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_locations_home_city_id_fkey"
      columns: ["home_city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_locations_home_city_id_fkey"
      columns: ["home_city_id"]
isOneToOne: false
      referencedRelation: "city_stats"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_locations_status_city_id_fkey"
      columns: ["status_city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_locations_status_city_id_fkey"
      columns: ["status_city_id"]
isOneToOne: false
      referencedRelation: "city_stats"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_locations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "account_type": string,"avatar_hue": number | null,"avatar_path": string | null,"bio": string | null,"cover_mode": string,"cover_path": string | null,"created_at": string,"dream_trip_city_id": string | null,"id": string,"name": string,"username": string,"follower_count": number | null,"following_count": number | null,"place_count": number | null,"suggestion_reason": string | null,"visible_home": Json | null,"visible_status": Json | null
                  }
                  ComputedFields: "follower_count" | "following_count" | "place_count" | "suggestion_reason" | "visible_home" | "visible_status"
                  Insert: {
                    "account_type"?: string,"avatar_hue"?: number | null,"avatar_path"?: string | null,"bio"?: string | null,"cover_mode"?: string,"cover_path"?: string | null,"created_at"?: string,"dream_trip_city_id"?: string | null,"id": string,"name": string,"username": string
                  }
                  Update: {
                    "account_type"?: string,"avatar_hue"?: number | null,"avatar_path"?: string | null,"bio"?: string | null,"cover_mode"?: string,"cover_path"?: string | null,"created_at"?: string,"dream_trip_city_id"?: string | null,"id"?: string,"name"?: string,"username"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_dream_trip_city_id_fkey"
      columns: ["dream_trip_city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profiles_dream_trip_city_id_fkey"
      columns: ["dream_trip_city_id"]
isOneToOne: false
      referencedRelation: "city_stats"
      referencedColumns: ["id"]
    }
                  ]
                },"review_comments": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"id": string,"review_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string,"body": string,"created_at"?: string,"id"?: string,"review_id": string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string,"review_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "review_comments_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "review_comments_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    }
                  ]
                },"review_likes": {
                  Row: {
                    "created_at": string,"review_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"review_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"review_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "review_likes_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "review_likes_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"review_media": {
                  Row: {
                    "caption": string | null,"created_at": string,"id": string,"kind": string,"path": string,"position": number,"review_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "caption"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"path": string,"position"?: number,"review_id": string
                  }
                  Update: {
                    "caption"?: string | null,"created_at"?: string,"id"?: string,"kind"?: string,"path"?: string,"position"?: number,"review_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "review_media_review_id_fkey"
      columns: ["review_id"]
isOneToOne: false
      referencedRelation: "reviews"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "author_id": string,"body": string | null,"created_at": string,"id": string,"place_id": string,"rating": number,"suited_for": (string)[],"updated_at": string,"comment_count": number | null,"like_count": number | null
                  }
                  ComputedFields: "comment_count" | "like_count"
                  Insert: {
                    "author_id"?: string,"body"?: string | null,"created_at"?: string,"id"?: string,"place_id": string,"rating": number,"suited_for"?: (string)[],"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string | null,"created_at"?: string,"id"?: string,"place_id"?: string,"rating"?: number,"suited_for"?: (string)[],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    }
                  ]
                },"saves": {
                  Row: {
                    "created_at": string,"place_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"place_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"place_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saves_place_id_fkey"
      columns: ["place_id"]
isOneToOne: false
      referencedRelation: "places"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "saves_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"settings": {
                  Row: {
                    "created_at": string,"default_share_close_friends": string,"default_share_everyone": string,"findable_by_contact": boolean,"follow_lists_visibility": string,"home_visibility": string,"map_visibility": string,"new_collections_private": boolean,"notifications_paused": boolean,"notify_close_friend_status": boolean,"notify_likes_comments": boolean,"notify_new_follower": boolean,"notify_trip_overlap": boolean,"show_in_suggestions": boolean,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"default_share_close_friends"?: string,"default_share_everyone"?: string,"findable_by_contact"?: boolean,"follow_lists_visibility"?: string,"home_visibility"?: string,"map_visibility"?: string,"new_collections_private"?: boolean,"notifications_paused"?: boolean,"notify_close_friend_status"?: boolean,"notify_likes_comments"?: boolean,"notify_new_follower"?: boolean,"notify_trip_overlap"?: boolean,"show_in_suggestions"?: boolean,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"default_share_close_friends"?: string,"default_share_everyone"?: string,"findable_by_contact"?: boolean,"follow_lists_visibility"?: string,"home_visibility"?: string,"map_visibility"?: string,"new_collections_private"?: boolean,"notifications_paused"?: boolean,"notify_close_friend_status"?: boolean,"notify_likes_comments"?: boolean,"notify_new_follower"?: boolean,"notify_trip_overlap"?: boolean,"show_in_suggestions"?: boolean,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "settings_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"suited_for_tags": {
                  Row: {
                    "created_at": string,"label": string,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"label": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "created_at"?: string,"label"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"travel_goals": {
                  Row: {
                    "created_at": string,"metric": string,"target": number,"updated_at": string,"user_id": string,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"metric": string,"target": number,"updated_at"?: string,"user_id"?: string,"year": number
                  }
                  Update: {
                    "created_at"?: string,"metric"?: string,"target"?: number,"updated_at"?: string,"user_id"?: string,"year"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "travel_goals_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "city_stats": {
                  Row: {
                    "average_rating": number | null,"country": string,"country_code": string | null,"cover_path": string | null,"id": string,"name": string,"place_count": number | null,"place_types": (string)[] | null,"popularity": number | null,"review_count": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "accept_follow_request":
{ Args: { "from_user": string }; Returns: undefined
                           },
"add_interest":
{ Args: { "interest_name": string }; Returns: {
              "created_at": string,
"created_by": string | null,
"id": string,
"is_starter": boolean,
"name": string,
"slug": string
            }
                          SetofOptions: {
        from: "*"
        to: "interests"
        isOneToOne: true
        isSetofReturn: false
      } },
"average_rating":
{ Args: { "place": Omit<Database["public"]['Tables']["places"]['Row'], Database["public"]['Tables']["places"]['ComputedFields']> }; Returns: number
                           },
"comment_count":
{ Args: { "review": Omit<Database["public"]['Tables']["reviews"]['Row'], Database["public"]['Tables']["reviews"]['ComputedFields']> }; Returns: number
                           },
"create_review":
{ Args: { "post": Json }; Returns: string
                           },
"follow":
{ Args: { "person": string }; Returns: string
                           },
"follower_count":
{ Args: { "profile": Omit<Database["public"]['Tables']["profiles"]['Row'], Database["public"]['Tables']["profiles"]['ComputedFields']> }; Returns: number
                           },
"following_count":
{ Args: { "profile": Omit<Database["public"]['Tables']["profiles"]['Row'], Database["public"]['Tables']["profiles"]['ComputedFields']> }; Returns: number
                           },
"friends_rating":
{ Args: { "place": Omit<Database["public"]['Tables']["places"]['Row'], Database["public"]['Tables']["places"]['ComputedFields']> }; Returns: number
                           },
"is_username_available":
{ Args: { "username": string }; Returns: boolean
                           },
"like_count":
{ Args: { "review": Omit<Database["public"]['Tables']["reviews"]['Row'], Database["public"]['Tables']["reviews"]['ComputedFields']> }; Returns: number
                           },
"place_count":
{ Args: { "profile": Omit<Database["public"]['Tables']["profiles"]['Row'], Database["public"]['Tables']["profiles"]['ComputedFields']> }; Returns: number
                           },
"popular_interests":
{ Args: { "max_results"?: number }; Returns: {
              "created_at": string,
"created_by": string | null,
"id": string,
"is_starter": boolean,
"name": string,
"slug": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "interests"
        isOneToOne: false
        isSetofReturn: true
      } },
"review_count":
{ Args: { "place": Omit<Database["public"]['Tables']["places"]['Row'], Database["public"]['Tables']["places"]['ComputedFields']> }; Returns: number
                           },
"search_places":
{ Args: { "query"?: string,"tags"?: (string)[],"types"?: (string)[] }; Returns: {
              "address": string,
"ai_summary": string | null,
"city_id": string,
"cover_path": string | null,
"created_at": string,
"created_by": string | null,
"description": string | null,
"id": string,
"is_verified": boolean,
"latitude": number | null,
"longitude": number | null,
"name": string,
"place_type": string,
"suited_for": (string)[],
"website": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "places"
        isOneToOne: false
        isSetofReturn: true
      } },
"search_profiles":
{ Args: { "query": string }; Returns: {
              "account_type": string,
"avatar_hue": number | null,
"avatar_path": string | null,
"bio": string | null,
"cover_mode": string,
"cover_path": string | null,
"created_at": string,
"dream_trip_city_id": string | null,
"id": string,
"name": string,
"username": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: false
        isSetofReturn: true
      } },
"suggested_friends":
{ Args: { "max_results"?: number }; Returns: {
              "account_type": string,
"avatar_hue": number | null,
"avatar_path": string | null,
"bio": string | null,
"cover_mode": string,
"cover_path": string | null,
"created_at": string,
"dream_trip_city_id": string | null,
"id": string,
"name": string,
"username": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: false
        isSetofReturn: true
      } },
"suggestion_reason":
{ Args: { "profile": Omit<Database["public"]['Tables']["profiles"]['Row'], Database["public"]['Tables']["profiles"]['ComputedFields']> }; Returns: string
                           },
"user_count":
{ Args: { "interest": Omit<Database["public"]['Tables']["interests"]['Row'], Database["public"]['Tables']["interests"]['ComputedFields']> }; Returns: number
                           },
"visible_home":
{ Args: { "profile": Omit<Database["public"]['Tables']["profiles"]['Row'], Database["public"]['Tables']["profiles"]['ComputedFields']> }; Returns: Json
                           },
"visible_status":
{ Args: { "profile": Omit<Database["public"]['Tables']["profiles"]['Row'], Database["public"]['Tables']["profiles"]['ComputedFields']> }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const

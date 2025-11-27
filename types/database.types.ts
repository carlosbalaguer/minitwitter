export type Profile = {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Tweet = {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export type Follow = {
  follower_id: string
  following_id: string
  created_at: string
}

export type TweetWithProfile = Tweet & {
  profiles: Profile
}
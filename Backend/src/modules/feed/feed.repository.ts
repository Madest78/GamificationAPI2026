import { FeedItemDto } from './feed.interface.js';

export interface FeedRepository {
    // Follows
    findFollow(followerId: string, followingId: string): Promise<{ id: string } | null>;
    createFollow(followerId: string, followingId: string): Promise<void>;
    deleteFollow(followerId: string, followingId: string): Promise<void>;
    findFollowingIds(userId: string): Promise<string[]>;

    // Feed items
    findAchievementsByUserIds(userIds: string[], take: number, skip: number): Promise<FeedItemDto[]>;
    findKudosByUserIds(userIds: string[], take: number, skip: number): Promise<FeedItemDto[]>;

    // Following/Followers lists
    findFollowingUsers(userId: string): Promise<Array<{ id: string; name: string | null; email: string; avatarUrl: string | null }>>;
    findFollowerUsers(userId: string): Promise<Array<{ id: string; name: string | null; email: string; avatarUrl: string | null }>>;
}

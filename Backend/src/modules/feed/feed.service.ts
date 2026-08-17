import { UserRepository } from '../users/user.repository.js';
import { FeedRepository } from './feed.repository.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '@/errors/AppErrors.js';
import { FeedItemDto } from './feed.interface.js';

export class FeedService {
    constructor(
        private userRepo: UserRepository,
        private feedRepo: FeedRepository,
    ) {}

    async follow(followerId: string, followingId: string) {
        if (followerId === followingId) {
            throw new BadRequestError('Cannot follow yourself');
        }

        const follower = await this.userRepo.findById(followerId);
        if (!follower) {
            throw new NotFoundError('Follower not found');
        }

        const following = await this.userRepo.findById(followingId);
        if (!following) {
            throw new NotFoundError('User to follow not found');
        }

        const existingFollow = await this.feedRepo.findFollow(followerId, followingId);
        if (existingFollow) {
            throw new ForbiddenError('Already following');
        }

        await this.feedRepo.createFollow(followerId, followingId);
    }

    async unfollow(followerId: string, followingId: string) {
        await this.feedRepo.deleteFollow(followerId, followingId);
    }

    async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<FeedItemDto[]> {
        const followingIds = await this.feedRepo.findFollowingIds(userId);
        followingIds.push(userId);

        const skip = (page - 1) * limit;

        const achievements = await this.feedRepo.findAchievementsByUserIds(followingIds, limit, skip);
        const kudos = await this.feedRepo.findKudosByUserIds(followingIds, limit, skip);

        return [...achievements, ...kudos]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }

    async getFollowing(userId: string) {
        return this.feedRepo.findFollowingUsers(userId);
    }

    async getFollowers(userId: string) {
        return this.feedRepo.findFollowerUsers(userId);
    }
}

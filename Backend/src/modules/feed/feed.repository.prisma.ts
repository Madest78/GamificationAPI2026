import { PrismaClient } from '@/generated/prisma/client.js';
import { FeedRepository } from './feed.repository.js';
import { FeedItemDto } from './feed.interface.js';

export class PrismaFeedRepository implements FeedRepository {
    constructor(private prisma: PrismaClient) {}

    async findFollow(followerId: string, followingId: string): Promise<{ id: string } | null> {
        return this.prisma.follow.findUnique({
            where: { followerId_followingId: { followerId, followingId } },
            select: { id: true },
        });
    }

    async createFollow(followerId: string, followingId: string): Promise<void> {
        await this.prisma.follow.create({
            data: { followerId, followingId },
        });
    }

    async deleteFollow(followerId: string, followingId: string): Promise<void> {
        await this.prisma.follow.delete({
            where: { followerId_followingId: { followerId, followingId } },
        });
    }

    async findFollowingIds(userId: string): Promise<string[]> {
        const follows = await this.prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
        });
        return follows.map(f => f.followingId);
    }

    async findAchievementsByUserIds(userIds: string[], take: number, skip: number): Promise<FeedItemDto[]> {
        const achievements = await this.prisma.userAchievement.findMany({
            where: { userId: { in: userIds } },
            include: { user: true, achievementDef: true },
            orderBy: { earnedAt: 'desc' },
            take,
            skip,
        });

        return achievements.map(a => ({
            type: 'achievement' as const,
            userId: a.userId,
            userName: a.user.name || a.user.email,
            userAvatar24: a.user.avatarUrl24,
            userAvatar32: a.user.avatarUrl32,
            userAvatar48: a.user.avatarUrl48,
            userAvatar72: a.user.avatarUrl72,
            userAvatar192: a.user.avatarUrl192,
            userAvatar512: a.user.avatarUrl512,
            data: {
                achievement: a.achievementDef.name,
                points: a.achievementDef.points,
            },
            createdAt: a.earnedAt,
        }));
    }

    async findKudosByUserIds(userIds: string[], take: number, skip: number): Promise<FeedItemDto[]> {
        const kudos = await this.prisma.kudosTransaction.findMany({
            where: {
                OR: [
                    { senderId: { in: userIds } },
                    { receiverId: { in: userIds } },
                ],
            },
            include: { sender: true, receiver: true, kudosType: true },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });

        return kudos.map(k => ({
            type: 'kudos' as const,
            userId: k.senderId,
            userName: k.sender.name || k.sender.email,
            userAvatar24: k.sender.avatarUrl24,
            userAvatar32: k.sender.avatarUrl32,
            userAvatar48: k.sender.avatarUrl48,
            userAvatar72: k.sender.avatarUrl72,
            userAvatar192: k.sender.avatarUrl192,
            userAvatar512: k.sender.avatarUrl512,
            data: {
                receiver: k.receiver.name || k.receiver.email,
                type: k.kudosType.name,
                emoji: k.kudosType.emoji,
                message: k.message,
            },
            createdAt: k.createdAt,
        }));
    }

    async findFollowingUsers(userId: string) {
        const follows = await this.prisma.follow.findMany({
            where: { followerId: userId },
            include: { following: true },
        });
        return follows.map(f => ({
            id: f.following.id,
            name: f.following.name,
            email: f.following.email,
            avatarUrl24: f.following.avatarUrl24,
            avatarUrl32: f.following.avatarUrl32,
            avatarUrl48: f.following.avatarUrl48,
            avatarUrl72: f.following.avatarUrl72,
            avatarUrl192: f.following.avatarUrl192,
            avatarUrl512: f.following.avatarUrl512,
        }));
    }

    async findFollowerUsers(userId: string) {
        const follows = await this.prisma.follow.findMany({
            where: { followingId: userId },
            include: { follower: true },
        });
        return follows.map(f => ({
            id: f.follower.id,
            name: f.follower.name,
            email: f.follower.email,
            avatarUrl24: f.follower.avatarUrl24,
            avatarUrl32: f.follower.avatarUrl32,
            avatarUrl48: f.follower.avatarUrl48,
            avatarUrl72: f.follower.avatarUrl72,
            avatarUrl192: f.follower.avatarUrl192,
            avatarUrl512: f.follower.avatarUrl512,
        }));
    }
}

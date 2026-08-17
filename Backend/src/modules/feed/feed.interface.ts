import { z } from 'zod';

const followUserSchema = z.object({
    followingId: z.string(),
});

type FollowUserDto = z.infer<typeof followUserSchema>;

interface FollowDto {
    id: string;
    followerId: string;
    followingId: string;
    createdAt: Date;
}

interface FeedItemDto {
    type: 'achievement' | 'kudos';
    userId: string;
    userName: string;
    userAvatar: string | null;
    data: unknown;
    createdAt: Date;
}

export {
    followUserSchema,
    FollowUserDto,
    FollowDto,
    FeedItemDto,
};

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
    userAvatar24: string | null;
    userAvatar32: string | null;
    userAvatar48: string | null;
    userAvatar72: string | null;
    userAvatar192: string | null;
    userAvatar512: string | null;
    data: unknown;
    createdAt: Date;
}

export {
    followUserSchema,
    FollowUserDto,
    FollowDto,
    FeedItemDto,
};

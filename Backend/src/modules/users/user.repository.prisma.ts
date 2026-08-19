import { PrismaClient } from "@/generated/prisma/client.js";
import { UserRepository } from "./user.repository.js";
import { CreateUserDto, UpdateUserDto, UserDto } from "./user.interface.js";

export class PrismaUserRepository implements UserRepository {
    private toDto(user: any): UserDto {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            emplannerUid: user.emplannerUid,
            slackId: user.slackId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }
    }

    constructor(private prisma: PrismaClient) {
    }

    async findById(id: string): Promise<UserDto | null> {
        const user = await this.prisma.user.findUnique({
            where: {id: id}
        });
        if (!user) return null;
        return this.toDto(user);
    }

    async findByEmail(email: string): Promise<UserDto | null> {
        const user = await this.prisma.user.findUnique({
            where: {email: email}
        });
        if (!user) return null;
        return this.toDto(user);
    }

    async findByGoogleId(googleId: string): Promise<UserDto | null> {
        const user = await this.prisma.user.findUnique({
            where: {googleId: googleId}
        });
        if (!user) return null;
        return this.toDto(user);
    }

    async findByEmplannerUid(emplannerUid: string): Promise<UserDto | null> {
        const user = await this.prisma.user.findUnique({
            where: {emplannerUid: emplannerUid}
        });
        if (!user) return null;
        return this.toDto(user);
    }

    async findBySlackId(slackId: string): Promise<UserDto | null> {
        const user = await this.prisma.user.findUnique({
            where: {slackId: slackId}
        });
        if (!user) return null;
        return this.toDto(user);
    }

    async create(data: CreateUserDto): Promise<UserDto> {
        const user = await this.prisma.user.create({ data });
        return this.toDto(user)
    }

    async update(id: string, data: UpdateUserDto): Promise<UserDto> {
        const user = await this.prisma.user.update({
            where: {id},
            data,
        });
        return this.toDto(user)
    }

    async findRolesByUserId(userId: string): Promise<string[]> {
        const userRoles = await this.prisma.userRole.findMany({
            where: { userId },
            include: { role: true },
        });
        return userRoles.map(ur => ur.role.code);
    }

    async findUserWithRoles(userId: string): Promise<{ id: string; email: string; roles: string[] } | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { roles: { include: { role: true } } },
        });
        if (!user) return null;
        return {
            id: user.id,
            email: user.email,
            roles: user.roles.map(ur => ur.role.code),
        };
    }
}

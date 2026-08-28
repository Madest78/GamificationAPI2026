import { UserDto, CreateUserDto, UpdateUserDto } from "./user.interface.js"

export interface UserRepository {
    findById(id: string): Promise<UserDto | null>
    findByEmail(email: string): Promise<UserDto | null>
    findByGoogleId(googleId: string): Promise<UserDto | null>
    findByEmplannerUid(emplannerUid: string): Promise<UserDto | null>
    findByExtraId(extraId: string): Promise<UserDto | null>
    findBySlackId(slackId: string): Promise<UserDto | null>
    create(data: CreateUserDto): Promise<UserDto>
    update(id: string, data: UpdateUserDto): Promise<UserDto>
    deleteById(id: string): Promise<void>
    findRolesByUserId(userId: string): Promise<string[]>
    findUserWithRoles(userId: string): Promise<{ id: string; email: string; roles: string[] } | null>
    findSpecializationsByUserId(userId: string): Promise<string[]>
}
import {ConflictException, Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import type {Repository} from "typeorm";
import {User} from "./user.entity";

@Injectable()
export class UsersService {
    constructor(@InjectRepository(User) private repo: Repository<User>) {
    }

    async create(publicKey: string): Promise<User> {
        const existing = await this.repo.findOne({
            where: [{publicKey}],
        });
        if (existing) {
            throw new ConflictException("publicKey already taken");
        }
        const user = this.repo.create({publicKey});
        return this.repo.save(user);
    }

    async deleteById(id: string): Promise<void> {
        await this.repo.delete(id);
    }
}

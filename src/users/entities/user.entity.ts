import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { ProfileEntity } from "../../profile/entities/profile.entity";
import { FollowEntity } from "../../follow/entities/follow.entity";

@Entity("users")
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column('text', { array: true, default: [] })
  onesignal_player_ids: string[];

  @OneToOne(() => ProfileEntity, (p) => p.user, { cascade: true })
  @JoinColumn()
  profile: ProfileEntity;

  @OneToMany(() => FollowEntity, (follow) => follow.following)
  followers: FollowEntity[];

  @OneToMany(() => FollowEntity, (follow) => follow.follower)
  following: FollowEntity[];
}

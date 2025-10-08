import { Entity, PrimaryGeneratedColumn, Column, OneToOne, BeforeInsert, OneToMany } from 'typeorm';
import { randomUUID } from 'crypto';
import { UserEntity } from 'src/users/entities/user.entity';
import { NotesEntity } from 'src/notes/entities/notes.entity';

@Entity()
export class ProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true, unique: true })
  username: string;

  @Column({ nullable: true })
  avatar?: string;

  @OneToOne(() => UserEntity, (user) => user.profile)
  user: UserEntity;

  @OneToMany(() => NotesEntity, (note) => note.profile, { cascade: true })
  notes: NotesEntity[];

  @BeforeInsert()
  generateUsername() {
    if (!this.firstName && !this.lastName) {
      this.username = 'user_' + randomUUID().slice(0, 8);
    } else {
      const base = `${this.firstName ?? ''}${this.lastName ?? ''}`.toLowerCase();
      this.username = base || 'user_' + randomUUID().slice(0, 8);
    }
  }
}

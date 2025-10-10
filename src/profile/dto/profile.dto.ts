import { NotesEntity } from "./../../notes/entities/notes.entity";
import { UserEntity } from "./../../users/entities/user.entity";

export class ProfileDto {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  coverImage?: string;
  user: UserEntity[];
  notes: NotesEntity[]
}
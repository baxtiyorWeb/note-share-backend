import { NotesEntity } from "src/notes/entities/notes.entity";
import { UserEntity } from "src/users/entities/user.entity";

export class ProfileDto {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  user: UserEntity[];
  notes: NotesEntity[]
}
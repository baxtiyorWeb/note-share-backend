import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { NotesEntity } from './../../notes/entities/notes.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: string;
  
  @Column()
  name: string;

  @OneToMany(() => NotesEntity, (note) => note.category)
  notes: NotesEntity[];
}

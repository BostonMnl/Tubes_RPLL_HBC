import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user';

@Table({
  tableName: 'absensi_start',
  timestamps: false,
})
export class AbsensiStart extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
    allowNull: false,
  })
  declare absensi_start_id: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare absensi_dimulai: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare user_id: string;

  @BelongsTo(() => User)
  user!: User;
}

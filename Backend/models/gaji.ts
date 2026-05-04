import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { User } from './user';

@Table({
    tableName: 'gaji',
    timestamps: true,
    paranoid: true,
})
export class Gaji extends Model {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
        allowNull: false
    })
    declare gaji_id: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare user_id: string;

    @Column({
        type: DataType.FLOAT,
        allowNull: false
    })
    declare nominal: number;

    @Column({
        type: DataType.DATEONLY,
        unique: true,
        allowNull: false
    })
    declare tanggal_berlaku: Date;

    @BelongsTo(() => User)
    user!: User;
}

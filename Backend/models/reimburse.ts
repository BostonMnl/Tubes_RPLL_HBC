import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user';
import { Gaji } from './gaji';

@Table({
    tableName: 'reimburse',
    timestamps: true,
    paranoid: true
})
export class Reimburse extends Model {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
        allowNull: false
    })
    declare reimburse_id: string;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare keterangan: string | null;

    @Column({
        type: DataType.FLOAT,
        allowNull: false
    })
    declare nominal: number;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare gambar: string | null;

    @Column({
        type: DataType.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending'
    })
    declare status: string;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false
    })
    declare tanggal: Date;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare user_id: string;

    @ForeignKey(() => Gaji)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare gaji_id: string | null;

    @BelongsTo(() => User)
    user!: User;

    @BelongsTo(() => Gaji)
    gaji!: Gaji;
}

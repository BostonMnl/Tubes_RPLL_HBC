import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user';

@Table({
    tableName: 'absensi',
    timestamps: true,
})
export class Absensi extends Model {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare absensi_id: string;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false,
    })
    declare date: Date;

    @Column({
        type: DataType.TIME,
        allowNull: false,
    })
    declare jam_masuk: string;

    @Column({
        type: DataType.TIME,
        allowNull: true,
    })
    declare jam_keluar: string | null;

            @Column({
                type: DataType.ENUM('Hadir', 'Telat', 'Sakit', 'Cuti', 'Alpha'),
                allowNull: false,
            })
    declare status: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    declare qr_code: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare user_id: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    declare createdAt: Date | null;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    declare updatedAt: Date | null;

    @BelongsTo(() => User)
    user!: User;
}

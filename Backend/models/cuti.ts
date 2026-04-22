import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user';

@Table({
    tableName: 'cuti',
    timestamps: true,
    paranoid: true
})
export class Cuti extends Model {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
        allowNull: false
    })
    declare cuti_id: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare keterangan: string;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false
    })
    declare tanggal_mulai: Date;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false
    })
    declare tanggal_akhir: Date;

    @Column({
        type: DataType.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
        allowNull: false
    })
    declare status: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare disetujui_oleh: string | null;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare user_id: string;

    @BelongsTo(() => User, { foreignKey: 'user_id' })
    user!: User;

    @BelongsTo(() => User, { foreignKey: 'disetujui_oleh' })
    approvedByUser!: User;
}
import { Table, Column, Model, DataType, ForeignKey, BelongsTo, AllowNull } from 'sequelize-typescript';
import { User } from './user';
import { Payroll } from './payroll';

@Table({
    tableName: 'penalti',
    timestamps: true,
    paranoid: true
})
export class Penalti extends Model {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
        allowNull: false
    })
    declare penalti_id: string;

    @Column({
        type: DataType.ENUM('Cuti Tidak Berbayar', 'Mengrusak', 'Telat Masuk'),
        allowNull: false
    })
    declare jenis: string;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare keterangan: string;

    @Column({
        type: DataType.FLOAT,
        allowNull: false
    })
    declare nominal: number;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false
    })
    declare tanggal: Date;

    @Column({
        type: DataType.STRING,
        allowNull: true
    })
    declare gambar: string | null;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare user_id: string;

    @ForeignKey(() => Payroll)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare payroll_id: string | null;

    @BelongsTo(() => User)
    user!: User;

}
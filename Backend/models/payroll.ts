import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user';

@Table({
    tableName: 'payroll',
    timestamps: true,
    paranoid: true
})
export class Payroll extends Model {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
        allowNull: false
    })
    declare payroll_id: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare user_id: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare bulan: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare tahun: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false
    })
    declare gaji_pokok: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false
    })
    declare total_insentif: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false
    })
    declare total_reimburse: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false
    })
    declare total_penalti: number;

    @Column({
        type: DataType.FLOAT,
        allowNull: false
    })
    declare take_home_pay: number;

    @BelongsTo(() => User)
    user!: User;
}
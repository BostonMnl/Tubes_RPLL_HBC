import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './user';
import { Payroll } from './payroll';

@Table({
    tableName: 'insentif',
    timestamps: true,
    paranoid: true
})
export class Insentif extends Model {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        defaultValue: DataType.UUIDV4,
        allowNull: false
    })
    declare insentif_id: string;

    @Column({
        type: DataType.FLOAT,
        allowNull: false
    })
    declare nominal: number;

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare keterangan: string;

    @Column({
        type: DataType.DATEONLY,
        allowNull: false
    })
    declare tanggal: Date;

    @ForeignKey(() => Payroll)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare payroll_id: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare user_id: string;

    @BelongsTo(() => Payroll)
    payroll!: Payroll;

    @BelongsTo(() => User)
    user!: User;
    

}

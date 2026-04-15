import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { v4 } from 'uuid';
import { User } from './user';

@Table({
    tableName: 'resetPasswordRequest',
    timestamps: false,
    paranoid: true,
})
export class ResetPasswordRequest extends Model {
    @Column({
        type: DataType.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: v4(),
    })
    declare reset_id: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare user_id: string;

    @BelongsTo(() => User)
    declare user: User;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    declare created_at: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    declare deleted_at: Date | null;
}

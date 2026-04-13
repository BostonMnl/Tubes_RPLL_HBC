import { Table, Column, Model, DataType, HasMany, BeforeCreate, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Col } from 'sequelize/types/utils';
import { v4 } from 'uuid';
import bcrypt from 'bcrypt';


@Table({
    tableName : 'user',
    timestamps : true,
    paranoid : true
})
export class User extends Model {
    @Column({
        type : DataType.UUID,
        primaryKey : true,
        defaultValue : v4(),
        allowNull : false
    })
    declare user_id : string;

    @Column({
        type : DataType.STRING,
        allowNull : false
    })
    declare nama : string;

    @Column({
        type : DataType.STRING,
        allowNull : false,
    })
    declare alamat : string;
    
    @Column({
        type : DataType.STRING,
        allowNull : false,
        unique : true,
        validate :{
            isEmail : true
        }
    })
    declare email : string;

    @Column({
        type : DataType.STRING,
        allowNull : false
    })
    declare password : string;

    @Column({
        type : DataType.STRING,
        allowNull : false
    })
    declare jabatan : string;

    @Column({
        type : DataType.STRING,
        allowNull : true
    })
    declare gambar : string;

    @Column({
        type : DataType.ENUM('admin','staff'),
        allowNull : false
    })
    declare role : string;

    @Column({
        type : DataType.STRING,
        allowNull : false
    })
    declare departemen : string;

    @ForeignKey(() => User)
    @Column({
        type : DataType.UUID,
        allowNull : true
    })
    declare manager_id : string;

    @BelongsTo(() => User)
    declare manager: User;

    //dunno if have to add HasMany 
    // because on ERD is 1 1 
    // but reality is manager or above person 
    // has many subordinates
    @HasMany(() => User)
    declare karyawan: User[];

    @BeforeCreate
    static async hashPassword(user: User) {
        if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
        }
    }

    async validatePassword(password: string): Promise<boolean> {
        return await bcrypt.compare(password, this.password);
    }
}

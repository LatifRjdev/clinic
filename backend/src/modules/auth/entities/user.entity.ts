import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums/roles.enum';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'middle_name', type: 'varchar', nullable: true })
  middleName: string | null;

  @Column()
  phone: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.DOCTOR })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({
    name: 'preferred_language',
    type: 'varchar',
    length: 2,
    default: 'ru',
  })
  preferredLanguage: 'ru' | 'tj';

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId: string | null;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ type: 'varchar', nullable: true })
  specialty: string | null;

  @Column({ type: 'varchar', nullable: true })
  qualification: string | null;

  @Column({ name: 'license_number', type: 'varchar', nullable: true })
  licenseNumber: string | null;

  @Column({ name: 'photo_url', type: 'varchar', nullable: true })
  photoUrl: string | null;

  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'two_factor_secret', type: 'varchar', nullable: true })
  twoFactorSecret: string | null;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'reset_password_token', type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Column({ name: 'reset_password_expires', type: 'timestamp', nullable: true })
  resetPasswordExpires: Date | null;

  @Column({ name: 'invite_token', type: 'varchar', nullable: true })
  inviteToken: string | null;

  @Column({ name: 'invite_expires', type: 'timestamp', nullable: true })
  inviteExpires: Date | null;
}

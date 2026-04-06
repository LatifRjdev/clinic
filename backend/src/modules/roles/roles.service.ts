import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomRole } from './entities/custom-role.entity';
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from './permissions';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(CustomRole)
    private readonly roleRepository: Repository<CustomRole>,
  ) {}

  getAllPermissions() {
    const grouped: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(PERMISSIONS)) {
      const [module] = value.split(':');
      if (!grouped[module]) grouped[module] = [];
      grouped[module].push(value);
    }
    return { permissions: PERMISSIONS, grouped };
  }

  getDefaultPermissions() {
    return DEFAULT_ROLE_PERMISSIONS;
  }

  async findAll() {
    return this.roleRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Роль не найдена');
    return role;
  }

  async create(data: { name: string; description?: string; permissions: string[]; baseRole?: string }) {
    const existing = await this.roleRepository.findOne({ where: { name: data.name } });
    if (existing) throw new ConflictException('Роль с таким именем уже существует');

    const role = this.roleRepository.create(data);
    return this.roleRepository.save(role);
  }

  async update(id: string, data: Partial<{ name: string; description: string; permissions: string[]; isActive: boolean }>) {
    const role = await this.findOne(id);
    Object.assign(role, data);
    return this.roleRepository.save(role);
  }

  async getPermissions(id: string): Promise<{ id: string; name: string; permissions: string[] }> {
    const role = await this.findOne(id);
    return { id: role.id, name: role.name, permissions: role.permissions ?? [] };
  }

  async updatePermissions(id: string, permissions: string[]): Promise<CustomRole> {
    if (!Array.isArray(permissions)) {
      throw new ConflictException('permissions должен быть массивом строк');
    }
    const allowed = new Set(Object.values(PERMISSIONS) as string[]);
    const invalid = permissions.filter((p) => !allowed.has(p));
    if (invalid.length > 0) {
      throw new ConflictException(`Неизвестные разрешения: ${invalid.join(', ')}`);
    }
    const role = await this.findOne(id);
    role.permissions = Array.from(new Set(permissions));
    return this.roleRepository.save(role);
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    await this.roleRepository.softRemove(role);
  }

  async getPermissionsForRole(roleName: string): Promise<string[]> {
    // First check custom roles
    const customRole = await this.roleRepository.findOne({ where: { name: roleName, isActive: true } });
    if (customRole) return customRole.permissions;

    // Fallback to default role permissions
    return DEFAULT_ROLE_PERMISSIONS[roleName] || [];
  }
}

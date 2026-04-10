import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * Servicio para gestionar usuarios.
 * Maneja creación, búsqueda y actualización de usuarios.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Crea un nuevo usuario.
   * @param createUserDto - Datos del usuario
   * @returns Usuario creado
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  /**
   * Busca usuario por email.
   * @param email - Email del usuario
   * @returns Usuario o null
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /**
   * Busca usuario por ID.
   * @param id - ID del usuario
   * @returns Usuario o null
   */
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  /**
   * Lista todos los usuarios.
   * @returns Lista de usuarios
   */
  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  /**
   * Actualiza el balance de un usuario.
   * @param id - ID del usuario
   * @param amount - Nuevo balance
   * @returns Usuario con balance actualizado
   */
  async updateBalance(id: string, amount: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    user.balance = amount;
    return this.usersRepository.save(user);
  }
}

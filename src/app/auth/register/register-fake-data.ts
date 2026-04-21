import { faker } from '@faker-js/faker/locale/pt_BR';

export interface RegisterFormFakeData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Dados fictícios para acelerar testes manuais no cadastro (dev / QA). */
export function generateFakeRegisterForm(): RegisterFormFakeData {
  const password = 'SenhaTeste123!';
  const token = faker.string.alphanumeric(3).toLowerCase();
  const name = faker.person.fullName();
  const prefixEmail = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '.');
  return {
    name,
    email: `${prefixEmail}+${token}@test.playkourt.com`,
    password,
    confirmPassword: password,
  };
}

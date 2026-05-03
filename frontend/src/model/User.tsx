import type { Jabatan, Role, Departemen } from "./EnumType";

export type User = {
  user_id: string;
  nama: string;
  alamat: string;
  tanggal_lahir:string,
  email: string;
  nomor_telepon: string;
  password: string;
  jabatan: Jabatan;
  manager_id: string;
  gambar: string;
  role: Role;
  departemen: Departemen;
};
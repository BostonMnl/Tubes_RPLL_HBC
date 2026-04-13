class User {
  final String user_id;
  final String nama;
  final String alamat;
  final String email;
  final String password;
  final Jabatan jabatan;
  final User manager_id;
  final String gambar;
  final Role role;
  final Departeman departeman;

  User({
    required this.user_id,
    required this.nama,
    required this.alamat,
    required this.email,
    required this.password,
    required this.jabatan,
    required this.manager_id,
    required this.gambar,
    required this.role,
    required this.departeman,
  });

}


enum Jabatan{
  MANAGER, STAFF, SUPERVISIOR
}

enum Role{
  ADMIN, KARYAWAN
}

enum Departeman{
  SALES, IT, FINANCE, PURCHASE
}
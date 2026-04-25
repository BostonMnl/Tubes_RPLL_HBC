class User {
  final String nama;
  final String email;
  final String? alamat;
  final String? nomorTelepon;
  final String? gambar;
  final Jabatan jabatan;
  final Role role;
  final Departeman departemen;

  User({
    required this.nama,
    required this.email,
    this.alamat,
    this.nomorTelepon,
    this.gambar,
    required this.jabatan,
    required this.role,
    required this.departemen,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      nama: json['nama'] ?? '',
      email: json['email'] ?? '',
      alamat: json['alamat'],
      nomorTelepon: json['nomor_telepon'],
      gambar: json['gambar'],
      jabatan: _parseJabatan(json['jabatan']),
      role: _parseRole(json['role']),
      departemen: _parseDepartemen(json['departemen']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nama': nama,
      'email': email,
      'alamat': alamat,
      'nomor_telepon': nomorTelepon,
      'gambar': gambar,
      'jabatan': jabatan.name,
      'role': role.name,
      'departemen': departemen.name,
    };
  }

  // =========================
  // SAFE ENUM PARSER
  // =========================
  static String _normalize(String? value) {
    return value?.toLowerCase().trim() ?? '';
  }

  static Jabatan _parseJabatan(String? value) {
    final v = _normalize(value);

    return Jabatan.values.firstWhere(
      (e) => e.name.toLowerCase() == v,
      orElse: () => Jabatan.STAFF,
    );
  }

  static Role _parseRole(String? value) {
    final v = _normalize(value);

    return Role.values.firstWhere(
      (e) => e.name.toLowerCase() == v,
      orElse: () => Role.KARYAWAN,
    );
  }

  static Departeman _parseDepartemen(String? value) {
    final v = _normalize(value);

    return Departeman.values.firstWhere(
      (e) => e.name.toLowerCase() == v,
      orElse: () => Departeman.IT,
    );
  }
}

enum Jabatan { MANAGER, STAFF, SUPERVISOR }

enum Role { ADMIN, KARYAWAN }

enum Departeman { SALES, IT, FINANCE, PURCHASE }

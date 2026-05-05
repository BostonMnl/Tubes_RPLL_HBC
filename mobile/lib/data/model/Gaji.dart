class Gaji {
  final String gajiId;
  final String userId;
  final num nominal;
  final DateTime tanggalBerlaku;
  final UserGaji? user;

  Gaji({
    required this.gajiId,
    required this.userId,
    required this.nominal,
    required this.tanggalBerlaku,
    this.user,
  });

  factory Gaji.fromJson(Map<String, dynamic> json) {
    return Gaji(
      gajiId: json['gaji_id'],
      userId: json['user_id'],
      nominal: json['nominal'],
      tanggalBerlaku: DateTime.parse(json['tanggal_berlaku']),
      user: json['user'] != null
          ? UserGaji.fromJson(json['user'])
          : null,
    );
  }
}

class UserGaji {
  final String nama;
  final String jabatan;

  UserGaji({
    required this.nama,
    required this.jabatan,
  });

  factory UserGaji.fromJson(Map<String, dynamic> json) {
    return UserGaji(
      nama: json['nama'],
      jabatan: json['jabatan'],
    );
  }
}
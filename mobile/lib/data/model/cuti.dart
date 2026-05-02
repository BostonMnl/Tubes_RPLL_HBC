class Cuti {
  final String cutiId;
  final String disetujuiOleh;
  final String keterangan;
  final DateTime tanggalMulai;
  final DateTime tanggalAkhir;
  final String status;

  Cuti({
    required this.cutiId,
    required this.disetujuiOleh,
    required this.keterangan,
    required this.tanggalMulai,
    required this.tanggalAkhir,
    required this.status,
  });

  factory Cuti.fromJson(Map<String, dynamic> json) {
    return Cuti(
      cutiId: json['cuti_id'].toString(),
      disetujuiOleh: json['disetujui_oleh'] ?? '-',
      keterangan: json['keterangan'] ?? '-',
      tanggalMulai: DateTime.parse(json['tanggal_mulai']).toLocal(),
      tanggalAkhir: DateTime.parse(json['tanggal_akhir']).toLocal(),
      status: json['status'],
    );
  }
}

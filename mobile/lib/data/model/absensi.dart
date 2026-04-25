class Absensi {
  final String absensiId;
  final DateTime date;
  final String jamMasuk;
  final String jamKeluar;
  final String status;
  final String qrCode;

  Absensi({
    required this.absensiId,
    required this.date,
    required this.jamMasuk,
    required this.jamKeluar,
    required this.status,
    required this.qrCode,
  });


  factory Absensi.fromJson(Map<String, dynamic> json) {
    return Absensi(
      absensiId: json['absensi_id'] as String,
      date: DateTime.parse(json['date']),
      jamMasuk: json['jam_masuk'] as String,
      jamKeluar: json['jam_keluar'] as String,
      status: json['status'] as String,
      qrCode: json['qr_code'] as String,
    );
  }

  // Convert dari Object ke JSON
  Map<String, dynamic> toJson() {
    return {
      'absensi_id': absensiId,
      'date': date.toIso8601String(),
      'jam_masuk': jamMasuk,
      'jam_keluar': jamKeluar,
      'status': status,
      'qr_code': qrCode,
    };
  }
}
class AttendanceRecord {
  final String date;
  final String? jamMasuk;
  final String? jamKeluar;
  final String? total;
  final String status;

  AttendanceRecord({
    required this.date,
    this.jamMasuk,
    this.jamKeluar,
    this.total,
    required this.status,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      date: json['date'] ?? '',
      jamMasuk: json['jam_masuk'],
      jamKeluar: json['jam_keluar'],
      total: json['total'],
      status: json['status'] ?? '-',
    );
  }
}
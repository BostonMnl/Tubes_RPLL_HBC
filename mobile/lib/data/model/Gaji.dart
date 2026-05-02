class Gaji {
  final String gajiId;
  final String userId;
  final double nominal;
  final DateTime tanggalBerlaku;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;

  Gaji({
    required this.gajiId,
    required this.userId,
    required this.nominal,
    required this.tanggalBerlaku,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
  });

  factory Gaji.fromJson(Map<String, dynamic> json) {
    return Gaji(
      gajiId: json['gaji_id'] ?? '',
      userId: json['user_id'] ?? '',
      // Menangani jika nominal datang sebagai int atau double
      nominal: (json['nominal'] as num).toDouble(),
      tanggalBerlaku: DateTime.parse(json['tanggal_berlaku']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      deletedAt: json['deletedAt'] != null 
          ? DateTime.parse(json['deletedAt']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'gaji_id': gajiId,
      'user_id': userId,
      'nominal': nominal,
      'tanggal_berlaku': tanggalBerlaku.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'deletedAt': deletedAt?.toIso8601String(),
    };
  }
}
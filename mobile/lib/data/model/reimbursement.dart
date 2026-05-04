class Reimbursement {
  final String reimbursementId;
  final String userId;
  final String description;
  final double amount;
  final String receiptImage;
  final String status;
  final DateTime date;

  Reimbursement({
    required this.reimbursementId,
    required this.userId,
    required this.description,
    required this.amount,
    required this.receiptImage,
    required this.status,
    required this.date,
  });

  factory Reimbursement.fromJson(Map<String, dynamic> json) {
    return Reimbursement(
      reimbursementId: json['reimburse_id'],
      userId: json['user_id'],
      description: json['keterangan'],
      amount: (json['nominal'] as num).toDouble(),
      receiptImage: json['gambar'],
      status: json['status'],
      date: DateTime.parse(json['tanggal']),
    );
  }
}
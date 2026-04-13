class Reimbursement {
  final String reimbursementId;
  final String userId;
  final String description;
  final double amount;
  final String receiptImage;
  final String status; // Pending, Approved, Rejected
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
}

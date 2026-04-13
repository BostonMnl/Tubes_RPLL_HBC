import 'package:mobile/model/user.dart';

class Log_aktivitas{
  final String log_id;
  final DateTime waktu;
  final String aktivitas;
  final User user_id;

  Log_aktivitas({
    required this.log_id,
    required this.waktu,
    required this.aktivitas,
    required this.user_id,
  });
}
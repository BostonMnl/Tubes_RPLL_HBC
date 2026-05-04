import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:mobile/data/model/Gaji.dart';
import 'package:mobile/data/model/cuti.dart';
import 'package:mobile/data/model/reimbursement.dart';
import 'package:mobile/data/model/user.dart';
import 'package:http_parser/http_parser.dart';

class ApiServices {
  static const String _baseUrl = "http://192.168.1.7:3000/api";

  static Future<String> forgotPassword(String email) async {
    final url = Uri.parse("$_baseUrl/forgot-password");

    final response = await http.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"email": email}),
    );

    final res = _handleResponse(response);

    return res['message'];
  }

  static Future<String> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    final response = await http.post(
      Uri.parse("$_baseUrl/reset-password"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"token": token, "newPassword": newPassword}),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return data["message"];
    } else {
      throw Exception(data["message"] ?? "Reset password gagal");
    }
  }

  static Future<User> getMyProfile(String token) async {
    final response = await http.get(
      Uri.parse("$_baseUrl/me"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    final data = jsonDecode(response.body);

    print("DATA: $data");

    if (response.statusCode == 200) {
      return User.fromJson(data['data']['user']);
    } else {
      throw Exception(data['message']);
    }
  }

  static Future<User> updateMyProfile({
    required String token,
    String? alamat,
    String? nomorTelepon,
    File? imageFile,
  }) async {
    final uri = Uri.parse("$_baseUrl/me");

    final request = http.MultipartRequest("PATCH", uri);

    // Header
    request.headers["Authorization"] = "Bearer $token";

    // Fields
    if (alamat != null) request.fields["alamat"] = alamat;
    if (nomorTelepon != null) {
      request.fields["nomor_telepon"] = nomorTelepon;
    }

    if (imageFile != null) {
      String ext = imageFile.path.split('.').last.toLowerCase();

      request.files.add(
        await http.MultipartFile.fromPath(
          "gambar",
          imageFile.path,
          contentType: MediaType('image', ext == 'png' ? 'png' : 'jpeg'),
        ),
      );
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    final data = jsonDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return User.fromJson(data['data']['user']);
    } else {
      throw Exception(data['message']);
    }
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final url = Uri.parse("$_baseUrl/auth/login");

    final response = await http.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"email": email, "password": password}),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (data['data'] == null) {
        throw Exception("Response tidak valid");
      }

      return {
        "token": data['data']['token'],
        "user": User.fromJson(data['data']['user']),
      };
    }

    final message = data['message'] ?? "Login gagal";

    throw Exception(_mapLoginError(message));
  }

  //Leave
  static Future<List<Cuti>> getMyCuti(String token) async {
    final response = await http.get(
      Uri.parse("$_baseUrl/cuti/me"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    final data = jsonDecode(response.body);

    print("CUTI RESPONSE: $data");

    if (response.statusCode == 200) {
      final List list = data['data']['cuti'];

      return list.map((e) => Cuti.fromJson(e)).toList();
    } else {
      throw Exception(data['message']);
    }
  }

  //Reimbursement
  static Future<List<Reimbursement>> getMyReimburse(String token) async {
    final response = await http.get(
      Uri.parse("$_baseUrl/reimburse/me"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    final data = jsonDecode(response.body);

    print("Reimburse RESPONSE: $data");

    if (response.statusCode == 200) {
      final List list = data['data']['reimburse'];

      return list.map((e) => Reimbursement.fromJson(e)).toList();
    } else {
      throw Exception(data['message']);
    }
  }

  static Future<void> createReimburse({
    required String token,
    required String keterangan,
    required int nominal,
    required File gambar,
    required DateTime tanggal,
  }) async {
    final uri = Uri.parse("$_baseUrl/reimburse");

    final request = http.MultipartRequest("POST", uri);

    request.headers["Authorization"] = "Bearer $token";

    request.fields["keterangan"] = keterangan;
    request.fields["nominal"] = nominal.toString();
    request.fields["tanggal"] = tanggal.toIso8601String();

    String ext = gambar.path.split('.').last.toLowerCase();

    request.files.add(
      await http.MultipartFile.fromPath(
        "gambar",
        gambar.path,
        contentType: MediaType('image', ext == 'png' ? 'png' : 'jpeg'),
      ),
    );

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    final data = jsonDecode(response.body);

    print("CREATE REIMBURSE RESPONSE: $data");

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(data['message'] ?? "Failed to create reimburse");
    }
  }

  static Future<void> createCuti({
    required String token,
    required String keterangan,
    required String jenisCuti,
    required DateTime tanggalMulai,
    required DateTime tanggalAkhir,
  }) async {
    final response = await http.post(
      Uri.parse("$_baseUrl/cuti"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: jsonEncode({
        "keterangan": keterangan,
        "jenis_cuti": jenisCuti,
        "tanggal_mulai": tanggalMulai.toIso8601String(),
        "tanggal_akhir": tanggalAkhir.toIso8601String(),
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(data['message'] ?? "Failed to create cuti");
    }
  }

  static Future<String> scanQR({
    required String token,
    required String qrToken,
  }) async {
    final response = await http.post(
      Uri.parse("$_baseUrl/attendance/scan"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: jsonEncode({"qr_token": qrToken}),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(data['message'] ?? "Gagal scan QR");
    }

    return data['attendance']['jam_masuk']; 
  }

  static Future<List<Gaji>> getMyGaji(String token) async {
    final response = await http.get(
      Uri.parse("$_baseUrl/gaji/me"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    final data = jsonDecode(response.body);

    print("GAJI RESPONSE: $data");

    if (response.statusCode == 200) {
      final List list = data['data']['gaji'];

      return list.map((e) => Gaji.fromJson(e)).toList();
    } else {
      throw Exception(data['message']);
    }
  }

  static Map<String, dynamic> _handleResponse(http.Response response) {
    final data = jsonDecode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Unknown error');
    }
  }

  static String _mapLoginError(String msg) {
    final lower = msg.toLowerCase();

    if (lower.contains("email not found")) {
      return "Email tidak ditemukan";
    } else if (lower.contains("wrong password")) {
      return "Password salah";
    } else if (lower.contains("invalid")) {
      return "Email atau password salah";
    } else if (lower.contains("unauthorized")) {
      return "Email atau password salah";
    } else {
      return msg;
    }
  }
}

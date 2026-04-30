import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:mobile/data/model/user.dart';

class ApiServices {
  static const String _baseUrl = "http://192.168.1.12:3000/api";

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
    final response = await http.patch(
      Uri.parse("$_baseUrl/me"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
      body: jsonEncode({"alamat": alamat, "nomor_telepon": nomorTelepon}),
    );

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

    // ✅ SUCCESS
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (data['data'] == null) {
        throw Exception("Response tidak valid");
      }

      return {
        "token": data['data']['token'],
        "user": User.fromJson(data['data']['user']),
      };
    }

    // ❌ ERROR HANDLING LEBIH RAPI
    final message = data['message'] ?? "Login gagal";

    throw Exception(_mapLoginError(message));
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

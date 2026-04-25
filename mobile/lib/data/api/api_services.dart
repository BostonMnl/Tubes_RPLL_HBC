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
    final uri = Uri.parse("$_baseUrl/me");

    final request = http.MultipartRequest("PATCH", uri);

    request.headers["Authorization"] = "Bearer $token";

    if (alamat != null) {
      request.fields["alamat"] = alamat;
    }

    if (nomorTelepon != null) {
      request.fields["nomor_telepon"] = nomorTelepon;
    }

    if (imageFile != null) {
      request.files.add(
        await http.MultipartFile.fromPath("gambar", imageFile.path),
      );
    }

    final response = await request.send();
    final res = await http.Response.fromStream(response);

    final data = jsonDecode(res.body);

    if (res.statusCode >= 200 && res.statusCode < 300) {
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

    print("URL: $url");

    final response = await http.post(
      url,
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "email": email,
        "password": password,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      return {
        "token": data['data']['token'],
        "user": User.fromJson(data['data']['user']),
      };
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

  User getDummyUser() {
    return User(
      nama: "Calvin Estanto Zendrato",
      email: "calvin@email.com",
      alamat: "Jl. Merdeka No. 123, Jakarta",
      nomorTelepon: "08123456789",
      gambar: null,
      jabatan: Jabatan.STAFF,
      role: Role.KARYAWAN,
      departemen: Departeman.IT,
    );
  }
}

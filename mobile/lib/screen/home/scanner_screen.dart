import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile/data/api/api_services.dart';
import 'package:mobile/data/auth/auth_storage.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:http/http.dart' as http;

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController controller = MobileScannerController();

  bool isProcessing = false;
  bool isCheckOut = false; // 🔥 mode scan

  String? token;

  final String baseUrl = ApiServices.apiUrl;

  @override
  void initState() {
    super.initState();
    controller.start();
    loadToken();
  }

  Future<void> loadToken() async {
    final t = await AuthStorage.getToken();
    setState(() {
      token = t;
    });
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }


  Future<String> scanQR(String qrToken) async {
    if (token == null) {
      throw Exception("Token belum tersedia");
    }

    final response = await http.post(
      Uri.parse("$baseUrl/attendance/scan"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: jsonEncode({
        "qr_token": qrToken,
      }),
    );

    final data = jsonDecode(response.body);
    print("MASUK RESPONSE: $data");

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(data['message'] ?? "Gagal scan QR");
    }

    return data['data']['attendance']['jam_masuk'];
  }

  Future<String> checkoutScanQR(String qrToken) async {
    if (token == null) {
      throw Exception("Token belum tersedia");
    }

    final response = await http.post(
      Uri.parse("$baseUrl/attendance/checkout/scan"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: jsonEncode({
        "qr_code": qrToken,
      }),
    );

    final data = jsonDecode(response.body);
    print("KELUAR RESPONSE: $data");

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(data['message'] ?? "Gagal scan QR");
    }

    return data['data']['attendance']['jam_keluar'];
  }

  // =======================
  // 🔥 HANDLE SCAN
  // =======================
  Future<void> handleScan(String code) async {
    if (isProcessing) return;

    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Token belum siap")),
      );
      return;
    }

    isProcessing = true;

    try {
      controller.stop();

      String jam;

      if (isCheckOut) {
        jam = await checkoutScanQR(code);
      } else {
        jam = await scanQR(code);
      }

      if (!mounted) return;

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text("Berhasil 🎉"),
          content: Text(
            isCheckOut
                ? "Jam Keluar: $jam"
                : "Jam Masuk: $jam",
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
              child: const Text("OK"),
            ),
          ],
        ),
      );

    } catch (e) {
      print("ERROR: $e");

      if (!mounted) return;

      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text("Gagal ❌"),
          content: Text(e.toString()),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                controller.start();
                isProcessing = false;
              },
              child: const Text("Scan Ulang"),
            ),
          ],
        ),
      );
    }
  }

  // =======================
  // UI
  // =======================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF0F5),

      appBar: AppBar(
        title: const Text(
          "Scan QR Attendance",
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: const Color(0xFFFF3D7F),
        centerTitle: true,
      ),

      body: Column(
        children: [
          // HEADER
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: const LinearGradient(
                colors: [Color(0xFFFF6FA5), Color(0xFFFF3D7F)],
              ),
            ),
            child: const Row(
              children: [
                Icon(Icons.qr_code_scanner, color: Colors.white),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    "Arahkan kamera ke QR Code untuk absensi",
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),

          // 🔥 MODE BUTTON
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          !isCheckOut ? Colors.green : Colors.grey[300],
                    ),
                    onPressed: () {
                      setState(() {
                        isCheckOut = false;
                      });
                    },
                    child: const Text("Scan Masuk"),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          isCheckOut ? Colors.red : Colors.grey[300],
                    ),
                    onPressed: () {
                      setState(() {
                        isCheckOut = true;
                      });
                    },
                    child: const Text("Scan Keluar"),
                  ),
                ),
              ],
            ),
          ),

          // 🔥 MODE TEXT
          Padding(
            padding: const EdgeInsets.all(8),
            child: Text(
              isCheckOut ? "Mode: Scan Keluar" : "Mode: Scan Masuk",
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isCheckOut ? Colors.red : Colors.green,
              ),
            ),
          ),

          // SCANNER
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: MobileScanner(
                controller: controller,
                onDetect: (capture) {
                  if (capture.barcodes.isEmpty) return;

                  final code = capture.barcodes.first.displayValue;
                  print("QR RESULT: $code");

                  if (code != null) {
                    handleScan(code);
                  }
                },
              ),
            ),
          ),

          // FOOTER
          const Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                Icon(Icons.info_outline, color: Colors.grey),
                SizedBox(height: 6),
                Text(
                  "Pastikan QR terlihat jelas dan tidak blur",
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController controller = MobileScannerController();

  Timer? timer;
  bool isScanned = false;

  @override
  void initState() {
    super.initState();

    controller.start(); 

    timer = Timer.periodic(const Duration(seconds: 10), (t) {
      _refreshData();
    });
  }

  void _refreshData() {
    print("Refresh data dari backend...");

  }

  @override
  void dispose() {
    timer?.cancel();
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Scan QR Attendance",
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.pink,
      ),

      body: MobileScanner(
        controller: controller,
        onDetect: (capture) {
          if (capture.barcodes.isEmpty) return; 

          final barcode = capture.barcodes.first;
          final String? code = barcode.displayValue;

          if (code != null) {
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(SnackBar(content: Text("QR Code: $code")));
          }
        },
      ),
    );
  }
}

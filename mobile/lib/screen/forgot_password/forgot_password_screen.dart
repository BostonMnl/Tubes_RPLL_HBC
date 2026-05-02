import 'package:flutter/material.dart';
import 'package:mobile/data/api/api_services.dart';
import 'package:mobile/screen/forgot_password/reset_password_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final emailController = TextEditingController();
  bool isLoading = false;

  @override
  void dispose() {
    emailController.dispose();
    super.dispose();
  }

  bool isValidEmail(String email) {
    return RegExp(r"^[^@]+@[^@]+\.[^@]+").hasMatch(email);
  }

  Future<void> handleForgotPassword() async {
    final email = emailController.text.trim();

    if (email.isEmpty) {
      _showSnackBar("Email tidak boleh kosong", isError: true);
      return;
    }

    if (!isValidEmail(email)) {
      _showSnackBar("Format email tidak valid", isError: true);
      return;
    }

    setState(() => isLoading = true);

    try {
      final response = await ApiServices.forgotPassword(email);

      if (!mounted) return;

      final message = response;

      // alert sukses
      _showDialog(
        title: "Berhasil",
        message: message,
        isSuccess: true,
        onPressed: () {
          Navigator.pop(context);

          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ResetPasswordScreen()),
          );
        },
      );

      emailController.clear();
    } catch (e) {
      if (!mounted) return;

      // alert error
      _showDialog(title: "Gagal", message: _cleanError(e), isSuccess: false);
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  void _showMessage(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  String _cleanError(dynamic e) {
    return e.toString().replaceAll("Exception:", "").trim();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Forgot Password"),
        backgroundColor: Colors.pink,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: "Masukkan Email",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: isLoading ? null : handleForgotPassword,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.pink),
                child: isLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        "Kirim Email Reset",
                        style: TextStyle(color: Colors.white),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDialog({
    required String title,
    required String message,
    required bool isSuccess,
    VoidCallback? onPressed,
  }) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(
          title,
          style: TextStyle(color: isSuccess ? Colors.green : Colors.red),
        ),
        content: Text(message),
        actions: [
          TextButton(
            onPressed:
                onPressed ??
                () {
                  Navigator.pop(context);
                },
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  void _showSnackBar(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? Colors.red : Colors.green,
      ),
    );
  }
}

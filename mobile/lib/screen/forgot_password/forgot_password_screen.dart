import 'package:flutter/material.dart';
import 'package:mobile/data/api/api_services.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
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
      _showMessage("Email tidak boleh kosong");
      return;
    }

    if (!isValidEmail(email)) {
      _showMessage("Format email tidak valid");
      return;
    }

    setState(() => isLoading = true);

    try {
      final message = await ApiServices.forgotPassword(email);

      if (!mounted) return;

      _showMessage(message);

      emailController.clear(); // 🔥 reset field
    } catch (e) {
      if (!mounted) return;

      _showMessage(_cleanError(e));
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _showMessage(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg)),
    );
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
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.pink,
                ),
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
}
import 'package:flutter/material.dart';
import 'package:mobile/data/api/api_services.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState
    extends State<ResetPasswordScreen> {

  final tokenController = TextEditingController();
  final passwordController = TextEditingController();

  bool isLoading = false;

  @override
  void dispose() {
    tokenController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> handleResetPassword() async {
    final token = tokenController.text.trim();
    final password = passwordController.text.trim();

    if (token.isEmpty) {
      _showMessage("Token wajib diisi");
      return;
    }

    if (password.isEmpty) {
      _showMessage("Password baru wajib diisi");
      return;
    }

    if (password.length < 8) {
      _showMessage("Password minimal 8 karakter");
      return;
    }

    setState(() => isLoading = true);

    try {
      final message = await ApiServices.resetPassword(
        token: token,
        newPassword: password,
      );

      if (!mounted) return;

      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text(
            "Berhasil",
            style: TextStyle(color: Colors.green),
          ),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);

                // kembali ke login
                Navigator.pop(context);
              },
              child: const Text("OK"),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;

      _showMessage(
        e.toString().replaceAll("Exception:", "").trim(),
      );
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  void _showMessage(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Reset Password"),
        backgroundColor: Colors.pink,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [

            TextField(
              controller: tokenController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: "Paste token dari email",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 20),

            TextField(
              controller: passwordController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: "Password baru",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed:
                    isLoading ? null : handleResetPassword,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.pink,
                ),
                child: isLoading
                    ? const CircularProgressIndicator(
                        color: Colors.white,
                      )
                    : const Text(
                        "Reset Password",
                        style: TextStyle(
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
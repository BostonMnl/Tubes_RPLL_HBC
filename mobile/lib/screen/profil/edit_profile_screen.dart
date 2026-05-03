import 'package:flutter/material.dart';
import 'package:mobile/data/api/api_services.dart';
import 'package:mobile/data/auth/auth_storage.dart';
import 'package:mobile/data/model/user.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final alamatController = TextEditingController();
  final teleponController = TextEditingController();

  bool isLoading = false;

  User? user;

  File? selectedImage;
  final picker = ImagePicker();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    final args = ModalRoute.of(context)?.settings.arguments;

    if (args != null && args is User) {
      user = args;
      alamatController.text = user?.alamat ?? "";
      teleponController.text = user?.nomorTelepon ?? "";
    }
  }

  @override
  void dispose() {
    alamatController.dispose();
    teleponController.dispose();
    super.dispose();
  }

  Future<void> pickImage() async {
    final picked = await picker.pickImage(source: ImageSource.gallery);

    if (picked != null) {
      setState(() {
        selectedImage = File(picked.path);
      });
    }
  }

  Future<void> handleSave() async {
    final token = await AuthStorage.getToken();

    if (token == null) {
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, "/login");
      return;
    }

    setState(() => isLoading = true);

    try {
      final updatedUser = await ApiServices.updateMyProfile(
        token: token,
        alamat: alamatController.text,
        nomorTelepon: teleponController.text,
        imageFile: selectedImage,
      );

      if (!mounted) return;

      Navigator.pop(context, updatedUser);
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (user == null) {
      return const Scaffold(
        body: Center(child: Text("User data not found")),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Edit Profile"),
        backgroundColor: Colors.pink,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            GestureDetector(
              onTap: pickImage,
              child: CircleAvatar(
                radius: 50,
                backgroundColor: Colors.grey[200],
                backgroundImage: selectedImage != null
                    ? FileImage(selectedImage!)
                    : (user!.gambar != null
                        ? NetworkImage(user!.gambar!)
                        : null),
                child: selectedImage == null && user!.gambar == null
                    ? const Icon(Icons.camera_alt, size: 30)
                    : null,
              ),
            ),

            const SizedBox(height: 16),

            TextField(
              controller: alamatController,
              decoration: const InputDecoration(labelText: "Alamat"),
            ),

            const SizedBox(height: 16),

            TextField(
              controller: teleponController,
              decoration: const InputDecoration(labelText: "Nomor Telepon"),
            ),

            const SizedBox(height: 30),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: isLoading ? null : handleSave,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.pink,
                ),
                child: isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text("Save"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
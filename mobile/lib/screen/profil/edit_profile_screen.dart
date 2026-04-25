import 'package:flutter/material.dart';
import 'package:mobile/data/api/api_services.dart';
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

  late User user;

  final String token = "ISI_TOKEN_DISINI";

  File? selectedImage;
  final picker = ImagePicker();

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    user = ModalRoute.of(context)!.settings.arguments as User;

    alamatController.text = user.alamat ?? "";
    teleponController.text = user.nomorTelepon ?? "";
  }

  @override
  Widget build(BuildContext context) {
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
              onTap: () async {
                final picked = await picker.pickImage(
                  source: ImageSource.gallery,
                );

                if (picked != null) {
                  setState(() {
                    selectedImage = File(picked.path);
                  });
                }
              },
              child: CircleAvatar(
                radius: 50,
                backgroundColor: Colors.grey[200],
                backgroundImage: selectedImage != null
                    ? FileImage(selectedImage!)
                    : (user.gambar != null
                          ? NetworkImage(user.gambar!) as ImageProvider
                          : null),
                child: selectedImage == null && user.gambar == null
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
                onPressed: isLoading
                    ? null
                    : () async {
                        setState(() => isLoading = true);

                        try {
                          await ApiServices.updateMyProfile(
                            token: token,
                            alamat: alamatController.text,
                            nomorTelepon: teleponController.text,
                            imageFile: selectedImage,
                          );

                          Navigator.pop(context, true);
                        } catch (e) {
                          ScaffoldMessenger.of(
                            context,
                          ).showSnackBar(SnackBar(content: Text("$e")));
                        } finally {
                          setState(() => isLoading = false);
                        }
                      },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.pink),
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

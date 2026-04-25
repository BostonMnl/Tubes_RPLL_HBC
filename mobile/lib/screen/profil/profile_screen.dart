import 'package:flutter/material.dart';
import 'package:mobile/data/api/api_services.dart';
import 'package:mobile/data/auth/auth_storage.dart';
import 'package:mobile/data/model/user.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  User? user;
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    loadProfile();
  }

  Future<void> loadProfile() async {
    try {
      final token = await AuthStorage.getToken();

      if (token == null) {
        throw Exception("Token tidak ditemukan, silakan login ulang");
      }

      final res = await ApiServices.getMyProfile(token);

      setState(() {
        user = res;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  // @override
  // void initState() {
  //   super.initState();

  //   //fetchProfile()

  //   Future.delayed(const Duration(seconds: 1), () {
  //     setState(() {
  //       user = ApiServices().getDummyUser();
  //       isLoading = false;
  //     });
  //   });
  // }

  // Future<void> fetchProfile() async {
  //   try {
  //     final res = await ApiServices.getMyProfile(token);

  //     setState(() {
  //       user = res;
  //       isLoading = false;
  //     });
  //   } catch (e) {
  //     setState(() {
  //       error = e.toString();
  //       isLoading = false;
  //     });
  //   }
  // }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Profile", style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.pink,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (error != null) {
      return Center(child: Text("Error: $error"));
    }

    return SingleChildScrollView(
      child: Column(
        children: [
          // 🔥 HEADER (gradient + avatar)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 30),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.pink, Colors.pinkAccent],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(30),
                bottomRight: Radius.circular(30),
              ),
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 50,
                  backgroundColor: Colors.white,
                  backgroundImage: user?.gambar != null
                      ? NetworkImage(user!.gambar!)
                      : null,
                  child: user?.gambar == null
                      ? const Icon(Icons.person, size: 50, color: Colors.pink)
                      : null,
                ),
                const SizedBox(height: 12),
                Text(
                  user?.nama ?? "-",
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?.jabatan.name ?? "-",
                  style: const TextStyle(color: Colors.white70),
                ),
                ElevatedButton.icon(
                  onPressed: () async {
                    final updated = await Navigator.pushNamed(
                      context,
                      "/edit-profile",
                      arguments: user,
                    );

                    // 🔥 refresh data setelah balik dari edit
                    if (updated == true) {
                      loadProfile();
                    }
                  },
                  icon: const Icon(Icons.edit, size: 18),
                  label: const Text("Edit Profile"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.pink,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                _buildInfoTile(Icons.location_on, "Alamat", user?.alamat),
                _buildInfoTile(Icons.email, "Email", user?.email),
                _buildInfoTile(Icons.phone, "No. Telp", user?.nomorTelepon),
                _buildInfoTile(
                  Icons.business,
                  "Departemen",
                  user?.departemen.name,
                ),
              ],
            ),
          ),

          const SizedBox(height: 30),

          // 🔥 LOGOUT BUTTON
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.logout, color: Colors.white),
                label: const Text(
                  "Logout",
                  style: TextStyle(color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.pink,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 5,
                ),
                onPressed: () async {
                  await AuthStorage.clearToken();
                  Navigator.pushNamedAndRemoveUntil(
                    context,
                    "/login",
                    (route) => false,
                  );
                },
              ),
            ),
          ),

          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String title, String? value) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 3,
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.pink.withOpacity(0.1),
          child: Icon(icon, color: Colors.pink),
        ),
        title: Text(title),
        subtitle: Text(value ?? "-"),
      ),
    );
  }
}

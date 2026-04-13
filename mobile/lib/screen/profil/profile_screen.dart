import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Profile", style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.pink,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const CircleAvatar(
              radius: 50,
              backgroundImage: NetworkImage("https://unsplash.com/s/photos/image"),
            ),

            const SizedBox(height: 16),

            const Text(
              "Calvin Estanto Zendrato",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 4),

            const Text(
              "Software Developer",
              style: TextStyle(color: Colors.blueGrey, fontSize: 16),
            ),

            const SizedBox(height: 20),

            Card(
              child: Column(
                children: const [
                  ListTile(
                    leading: Icon(Icons.location_on),
                    title: Text("Alamat"),
                    subtitle: Text("Jl. Merdeka No. 123, Jakarta"),
                  ),
                  Divider(),
                  ListTile(
                    leading: Icon(Icons.email),
                    title: Text("Email"),
                    subtitle: Text("calvin@email.com"),
                  ),
                  Divider(),
                  ListTile(
                    leading: Icon(Icons.business),
                    title: Text("Departemen"),
                    subtitle: Text("IT Department"),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.pink),
                onPressed: () {
                  // logic logout
                },
                child: const Text(
                  "Logout",
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

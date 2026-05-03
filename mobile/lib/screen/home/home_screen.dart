import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Harapan Bangsa Company",
          style: TextStyle(color: Colors.white),
        ),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            onPressed: () {
              Navigator.pushNamed(context, "/profile");
            },
            icon: const Icon(Icons.person, color: Colors.white, size: 30),
          ),
          IconButton(
            onPressed: () {
              print("Notifikasi");
              // Navigator.pushNamed(context, "/profile");
            },
            icon: const Icon(Icons.mail, color: Colors.white, size: 30),
          ),
        ],
        backgroundColor: Colors.pink,
      ),
      body: _buildBody(context),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.white,
        child: const Icon(Icons.qr_code_scanner),
        onPressed: () {
          Navigator.pushNamed(context, "/scanner");
        },
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    final List<Map<String, String>> attendanceData = [
      {
        "date": "07 Wed",
        "checkin": "09:00 AM",
        "checkout": "05:00 PM",
        "total": "7h 50m",
      },
      {
        "date": "07 Fri",
        "checkin": "09:00 AM",
        "checkout": "05:00 PM",
        "total": "7h 50m",
      },
      {
        "date": "07 Sun",
        "checkin": "09:00 AM",
        "checkout": "05:00 PM",
        "total": "7h 50m",
      },
      {
        "date": "07 Sun",
        "checkin": "09:00 AM",
        "checkout": "05:00 PM",
        "total": "7h 50m",
      },
      {
        "date": "07 Sun",
        "checkin": "09:00 AM",
        "checkout": "05:00 PM",
        "total": "7h 50m",
      },
      {
        "date": "08 Sun",
        "checkin": "09:00 AM",
        "checkout": "05:00 PM",
        "total": "7h 50m",
      },
    ];

    final List<String> months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    final List<String> years = List.generate(
      10,
      (index) => (2020 + index).toString(),
    );
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 16),

          Row(
            children: [
              _statCard(
                "2",
                "Leave",
                Colors.blue,
                onTap: () {
                  Navigator.pushNamed(context, "/leave");
                },
              ),
              _statCard(
                "5",
                "Reimbursement",
                Colors.purple,
                onTap: () {
                  Navigator.pushNamed(context, "/reimbursement");
                },
              ),
            ],
          ),

          Row(
            children: [
              _statCard(
                "Rp XXX,00",
                "Wage",
                Colors.red,
                onTap: () {
                  Navigator.pushNamed(context, "/wage");
                },
              ),
            ],
          ),

          const SizedBox(height: 16),

          const Align(
            alignment: Alignment.centerLeft,
            child: Text(
              "Attendance History",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),

          const SizedBox(height: 10),

          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: null,
                  decoration: InputDecoration(
                    labelText: "Month",
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  items: months.map((month) {
                    return DropdownMenuItem(value: month, child: Text(month));
                  }).toList(),
                  onChanged: (_) {},
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: null,
                  decoration: InputDecoration(
                    labelText: "Year",
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  items: years.map((year) {
                    return DropdownMenuItem(value: year, child: Text(year));
                  }).toList(),
                  onChanged: (_) {},
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // 🔥 INI YANG BENAR
          Expanded(
            child: ListView.builder(
              itemCount: attendanceData.length,
              itemBuilder: (context, index) {
                final data = attendanceData[index];

                return _attendanceCard(
                  date: data["date"]!,
                  checkin: data["checkin"]!,
                  checkout: data["checkout"]!,
                  total: data["total"]!,
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _statCard(
    String number,
    String title,
    Color color, {
    VoidCallback? onTap,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Container(
          margin: const EdgeInsets.all(6),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: color),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            children: [
              Text(
                number,
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(title),
            ],
          ),
        ),
      ),
    );
  }

  Widget _attendanceCard({
    required String date,
    required String checkin,
    required String checkout,
    required String total,
  }) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(child: Text(date.split(" ")[0])),

            const SizedBox(width: 12),

            // 🔥 Konten kanan
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    date,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 6),

                  Text("Check in: $checkin"),
                  Text("Check out: $checkout"),
                  Text("Total: $total"),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

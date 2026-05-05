import 'package:flutter/material.dart';
import 'package:mobile/data/api/api_services.dart';
import 'package:mobile/data/model/Gaji.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';

class WageScreen extends StatefulWidget {
  const WageScreen({super.key});

  @override
  State<WageScreen> createState() => _WageScreenState();
}

class _WageScreenState extends State<WageScreen> {
  DateTime selectedDate = DateTime.now();

  String token = "";
  bool isLoading = true;
  String? errorMessage;

  Gaji? gaji;

  final formatCurrency = NumberFormat("#,###", "id_ID");

  @override
  void initState() {
    super.initState();
    loadToken();
  }

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('token') ?? '';

    await fetchGaji();
  }

  Future<void> fetchGaji() async {
    if (token.isEmpty) return;

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final result = await ApiServices.getMyGaji(token);

      setState(() {
        gaji = result;
      });
    } catch (e) {
      setState(() {
        errorMessage = e.toString();
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  bool get isSameMonth {
    if (gaji == null) return false;

    final date = gaji!.tanggalBerlaku;
    return date.month == selectedDate.month && date.year == selectedDate.year;
  }

  int get totalSalary =>(gaji?.nominal ?? 0).toInt();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          "Wage Report",
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.pink,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: isLoading
            ? const Center(child: CircularProgressIndicator())
            : errorMessage != null
                ? Center(child: Text(errorMessage!))
                : Column(
                    children: [
                      _buildHeader(),
                      const SizedBox(height: 20),
                      _buildMonthPicker(),
                      const SizedBox(height: 20),
                      _buildTitle(),
                      const SizedBox(height: 10),
                      Expanded(child: _buildContent()),
                    ],
                  ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Colors.pink, Colors.pinkAccent],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Total Salary",
            style: TextStyle(color: Colors.white70),
          ),
          const SizedBox(height: 10),
          Text(
            "Rp ${formatCurrency.format(totalSalary)}",
            style: const TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMonthPicker() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          "${_monthName(selectedDate.month)} ${selectedDate.year}",
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.pink),
          icon: const Icon(Icons.calendar_month),
          label: const Text("Select Month"),
          onPressed: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: selectedDate,
              firstDate: DateTime(2020),
              lastDate: DateTime(2030),
            );

            if (picked != null) {
              setState(() {
                selectedDate = picked;
              });
            }
          },
        ),
      ],
    );
  }

  String _monthName(int month) {
    const months = [
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
    return months[month - 1];
  }

  Widget _buildTitle() {
    return const Align(
      alignment: Alignment.centerLeft,
      child: Text(
        "Salary Detail",
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildContent() {
    if (gaji == null) {
      return const Center(child: Text("No salary data"));
    }

    if (!isSameMonth) {
      return const Center(child: Text("No data for selected month"));
    }

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
      ),
      child: ListTile(
        leading: const Icon(Icons.attach_money, color: Colors.pink),
        title: Text(
          gaji?.user?.nama ?? "Employee",
        ),
        subtitle: Text(
          "Valid from: ${gaji!.tanggalBerlaku.toString().split(' ')[0]}",
        ),
        trailing: Text(
          "Rp ${formatCurrency.format(gaji!.nominal)}",
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.pink,
          ),
        ),
      ),
    );
  }
}
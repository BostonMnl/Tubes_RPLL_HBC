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
  bool isLoadingToken = true;

  List<Gaji> salaryData = [];
  bool isLoading = false;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    loadToken();
  }

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('token') ?? '';

    setState(() {
      isLoadingToken = false;
    });

    fetchGaji(); // langsung fetch setelah token ready
  }

  Future<void> fetchGaji() async {
    if (token.isEmpty) return;

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final data = await ApiServices.getMyGaji(token);

      setState(() {
        salaryData = data;
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

  final formatCurrency = NumberFormat("#,###", "id_ID");

  List<Gaji> get filteredData {
    return salaryData.where((item) {
      final d = item.createdAt; // pastikan field ini ada di model Gaji
      return d.month == selectedDate.month && d.year == selectedDate.year;
    }).toList();
  }

  int get totalSalary =>
      filteredData.fold(0, (sum, item) => sum + item.nominal.toInt());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("Wage Report", style: TextStyle(color: Colors.white)),
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
                  _buildMonthPicker(context),
                  const SizedBox(height: 20),
                  _buildHistoryTitle(),
                  const SizedBox(height: 10),
                  Expanded(child: _buildList()),
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
          const Text("Total Salary", style: TextStyle(color: Colors.white70)),
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

  Widget _buildMonthPicker(BuildContext context) {
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

  Widget _buildHistoryTitle() {
    return const Align(
      alignment: Alignment.centerLeft,
      child: Text(
        "Salary History",
        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildList() {
    if (filteredData.isEmpty) {
      return const Center(child: Text("No data for this month"));
    }

    return ListView.builder(
      itemCount: filteredData.length,
      itemBuilder: (context, index) {
        final item = filteredData[index];

        return Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
          child: ListTile(
            leading: const Icon(Icons.attach_money, color: Colors.pink),
            title: Text(
              "${_monthName(item.createdAt.month)} ${item.createdAt.year}",
            ),
            trailing: Text(
              "Rp ${formatCurrency.format(item.nominal)}",
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.pink,
              ),
            ),
          ),
        );
      },
    );
  }
}

import 'package:flutter/material.dart';

class WageScreen extends StatefulWidget {
  const WageScreen({super.key});

  @override
  State<WageScreen> createState() => _WageScreenState();
}

class _WageScreenState extends State<WageScreen> {
  DateTime selectedDate = DateTime.now();

  final List<Map<String, dynamic>> salaryData = [
    {"date": DateTime(2025, 1), "amount": 5000000},
    {"date": DateTime(2024, 12), "amount": 4800000},
    {"date": DateTime(2024, 11), "amount": 4900000},
  ];

  List<Map<String, dynamic>> get filteredData {
    return salaryData.where((item) {
      final d = item['date'] as DateTime;
      return d.month == selectedDate.month && d.year == selectedDate.year;
    }).toList();
  }

  int get totalSalary => filteredData.fold(0, (sum, item) => sum + (item['amount'] as int));

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
        child: Column(
          children: [
            _buildHeader(),
            const SizedBox(height: 20),
            _buildMonthPicker(context),
            const SizedBox(height: 20),
            _buildReportCard(),
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
            "Rp $totalSalary",
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
        )
      ],
    );
  }

  String _monthName(int month) {
    const months = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    return months[month - 1];
  }

  Widget _buildReportCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.pink[50],
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: const [
          Column(
            children: [
              Icon(Icons.trending_up, color: Colors.pink),
              SizedBox(height: 5),
              Text("Income"),
              Text("+700K", style: TextStyle(color: Colors.pink)),
            ],
          ),
          Column(
            children: [
              Icon(Icons.trending_down, color: Colors.pink),
              SizedBox(height: 5),
              Text("Penalty"),
              Text("-200K", style: TextStyle(color: Colors.pink)),
            ],
          ),
          Column(
            children: [
              Icon(Icons.account_balance_wallet, color: Colors.pink),
              SizedBox(height: 5),
              Text("Net"),
              Text("5M", style: TextStyle(color: Colors.pink)),
            ],
          ),
        ],
      ),
    );
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
        final date = item['date'] as DateTime;

        return Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
          child: ListTile(
            leading: const Icon(Icons.attach_money, color: Colors.pink),
            title: Text("${_monthName(date.month)} ${date.year}"),
            trailing: Text(
              "Rp ${item['amount']}",
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

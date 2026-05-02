import 'package:flutter/material.dart';
import 'package:mobile/data/api/api_services.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../data/model/cuti.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LeaveScreen extends StatefulWidget {
  const LeaveScreen({super.key});

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> {
  DateTime focusedDay = DateTime.now();
  DateTime? selectedDay;

  String? selectedJenisCuti;
  bool isLoading = false;

  List<Cuti> cutiList = [];

  final TextEditingController keteranganController = TextEditingController();

  DateTime? startDate;
  DateTime? endDate;

  final List<String> jenisCutiList = [
    'Cuti_Tahunan',
    'Cuti_Sakit',
    'Cuti_Melahirkan',
    'Cuti_Lainnya',
  ];

  @override
  void initState() {
    super.initState();
    _loadCuti();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkStatusPopup();
    });
  }

  // ================= LOAD CUTI =================
  Future<void> _loadCuti() async {
    setState(() => isLoading = true);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token') ?? '';

      final result = await ApiServices.getMyCuti(token);

      setState(() {
        cutiList = result;
      });
    } catch (e) {
      debugPrint("ERROR CUTI: $e");
    } finally {
      setState(() => isLoading = false);
    }
  }

  DateTime normalize(DateTime d) {
    return DateTime(d.year, d.month, d.day);
  }

  // ================= FILTER =================
  List<Cuti> getCutiByDate(DateTime date) {
    final target = normalize(date);

    return cutiList.where((cuti) {
      final start = normalize(cuti.tanggalMulai);
      final end = normalize(cuti.tanggalAkhir);

      return !target.isBefore(start) && !target.isAfter(end);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = getCutiByDate(selectedDay ?? DateTime.now());

    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: const Text("Leave", style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.pink,
      ),
      body: Column(
        children: [
          // ================= CALENDAR =================
          TableCalendar(
            focusedDay: focusedDay,
            firstDay: DateTime(2020),
            lastDay: DateTime(2030),
            selectedDayPredicate: (day) => isSameDay(selectedDay, day),
            onDaySelected: (selected, focused) {
              setState(() {
                selectedDay = selected;
                focusedDay = focused;
              });
            },
            eventLoader: (day) => getCutiByDate(normalize(day)),
            headerStyle: const HeaderStyle(formatButtonVisible: false),
          ),

          const SizedBox(height: 10),

          // ================= LIST =================
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                ? const Center(child: Text("No Leave Data"))
                : ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final cuti = filtered[index];

                      final statusColor = cuti.status == "Approved"
                          ? Colors.green
                          : cuti.status == "Rejected"
                          ? Colors.red
                          : Colors.orange;

                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: statusColor,
                            child: const Icon(Icons.event, color: Colors.white),
                          ),
                          title: Text(
                            cuti.keterangan,
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Tanggal: ${cuti.tanggalMulai.toString().substring(0, 10)} - ${cuti.tanggalAkhir.toString().substring(0, 10)}",
                              ),
                              Text(
                                "Status: ${cuti.status}",
                                style: TextStyle(color: statusColor),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // ================= BUTTON =================
          Padding(
            padding: const EdgeInsets.all(10),
            child: ElevatedButton(
              onPressed: () => _showForm(context),
              child: const Text("Apply for Leave"),
            ),
          ),
        ],
      ),
    );
  }

  // ================= FORM =================
  void _showForm(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) {
        return SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    "Apply for Leave",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 15),

                  TextField(
                    controller: keteranganController,
                    decoration: const InputDecoration(
                      labelText: "Description",
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                  ),

                  const SizedBox(height: 15),

                  // ================= DROPDOWN =================
                  DropdownButtonFormField<String>(
                    value: selectedJenisCuti,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: "Jenis Cuti",
                      border: OutlineInputBorder(),
                    ),
                    items: jenisCutiList.map((jenis) {
                      return DropdownMenuItem(
                        value: jenis,
                        child: Text(jenis.replaceAll('_', ' ')),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        selectedJenisCuti = value;
                      });
                    },
                  ),

                  const SizedBox(height: 15),

                  // ================= DATE =================
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () async {
                            startDate = await showDatePicker(
                              context: context,
                              firstDate: DateTime(2020),
                              lastDate: DateTime(2030),
                            );
                            setState(() {});
                          },
                          child: Text(
                            startDate == null
                                ? "Start Date"
                                : startDate!.toString().substring(0, 10),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () async {
                            endDate = await showDatePicker(
                              context: context,
                              firstDate: DateTime(2020),
                              lastDate: DateTime(2030),
                            );
                            setState(() {});
                          },
                          child: Text(
                            endDate == null
                                ? "End Date"
                                : endDate!.toString().substring(0, 10),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // ================= SUBMIT =================
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.pink,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () async {
                        if (keteranganController.text.isEmpty ||
                            startDate == null ||
                            endDate == null ||
                            selectedJenisCuti == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Fill All Fields")),
                          );
                          return;
                        }

                        try {
                          final prefs = await SharedPreferences.getInstance();
                          final token = prefs.getString('token') ?? '';

                          await ApiServices.createCuti(
                            token: token,
                            keterangan: keteranganController.text,
                            jenisCuti: selectedJenisCuti!,
                            tanggalMulai: startDate!,
                            tanggalAkhir: endDate!,
                          );

                          Navigator.pop(context);

                          setState(() {
                            selectedJenisCuti = null;
                            keteranganController.clear();
                            startDate = null;
                            endDate = null;
                          });

                          _loadCuti();

                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Success")),
                          );
                        } catch (e) {
                          ScaffoldMessenger.of(
                            context,
                          ).showSnackBar(SnackBar(content: Text("Error: $e")));
                        }
                      },
                      child: const Text("Submit"),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  // ================= POPUP =================
  void _checkStatusPopup() async {
    final prefs = await SharedPreferences.getInstance();
    final alreadyShown = prefs.getBool('cuti_popup_shown') ?? false;

    if (alreadyShown) return;

    for (var cuti in cutiList) {
      if (cuti.status == "Approved" || cuti.status == "Rejected") {
        _showStatusDialog(cuti);
        await prefs.setBool('cuti_popup_shown', true);
        break;
      }
    }
  }

  void _showStatusDialog(Cuti cuti) {
    final color = cuti.status == "Approved" ? Colors.green : Colors.red;

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Leave Status"),
        content: Text("Status: ${cuti.status}"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }
}

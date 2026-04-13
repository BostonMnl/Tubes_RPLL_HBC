import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../model/cuti.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LeaveScreen extends StatefulWidget {
  const LeaveScreen({super.key});

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> {
  DateTime focusedDay = DateTime.now();
  DateTime? selectedDay;

  List<Cuti> cutiList = [
    Cuti(
      cutiId: "1",
      disetujuiOleh: "Manager",
      keterangan: "Liburan",
      tanggalMulai: DateTime(2026, 3, 20),
      tanggalAkhir: DateTime(2026, 3, 22),
      status: "Approved",
    ),
  ];

  final TextEditingController keteranganController = TextEditingController();

  DateTime? startDate;
  DateTime? endDate;

  List<Cuti> getCutiByDate(DateTime date) {
    return cutiList.where((cuti) {
      return date.isAfter(
            cuti.tanggalMulai.subtract(const Duration(days: 1)),
          ) &&
          date.isBefore(cuti.tanggalAkhir.add(const Duration(days: 1)));
    }).toList();
  }

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkStatusPopup();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Leave", style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.pink,
      ),
      body: Column(
        children: [
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
            eventLoader: (day) => getCutiByDate(day),
            
            headerStyle: const HeaderStyle(
              formatButtonVisible: false,
            ),

          ),

          const SizedBox(height: 10),

//LIST CUTI
          Expanded(
            child: ListView.builder(
              itemCount: getCutiByDate(selectedDay ?? DateTime.now()).length,
              itemBuilder: (context, index) {
                final cuti = getCutiByDate(
                  selectedDay ?? DateTime.now(),
                )[index];

                Color statusColor = cuti.status == "Approved"
                    ? Colors.green
                    : Colors.red;

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
                        Text("Disetujui oleh: ${cuti.disetujuiOleh}"),
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

          /// 📝 BUTTON FORM
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

  void _showForm(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              /// TITLE
              const Text(
                "Apply for Leave",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 15),

              /// KETERANGAN
              TextField(
                controller: keteranganController,
                decoration: InputDecoration(
                  labelText: "Description",
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                maxLines: 2,
              ),

              const SizedBox(height: 15),

              /// DATE PICKER ROW
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        startDate = await showDatePicker(
                          context: context,
                          firstDate: DateTime(2020),
                          lastDate: DateTime(2030),
                          initialDate: DateTime.now(),
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
                          initialDate: DateTime.now(),
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

              /// SUBMIT BUTTON
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.pink,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () {
                    if (keteranganController.text.isEmpty ||
                        startDate == null ||
                        endDate == null) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Fill In All Fields!")),
                      );
                      return;
                    }

                    setState(() {
                      cutiList.add(
                        Cuti(
                          cutiId: DateTime.now().toString(),
                          disetujuiOleh: "-",
                          keterangan: keteranganController.text,
                          tanggalMulai: startDate!,
                          tanggalAkhir: endDate!,
                          status: "Pending",
                        ),
                      );
                    });

                    Navigator.pop(context);
                  },
                  child: const Text("Submit"),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _checkStatusPopup() async {
    final prefs = await SharedPreferences.getInstance();

    // cek apakah sudah pernah tampil
    bool alreadyShown = prefs.getBool('cuti_popup_shown') ?? false;

    if (alreadyShown) return;

    for (var cuti in cutiList) {
      if (cuti.status == "Approved" || cuti.status == "Rejected") {
        _showStatusDialog(cuti);

        // simpan bahwa popup sudah ditampilkan
        await prefs.setBool('cuti_popup_shown', true);
        break;
      }
    }
  }

  void _showStatusDialog(Cuti cuti) {
    Color statusColor = cuti.status == "Approved" ? Colors.green : Colors.red;

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
          ),
          title: Row(
            children: [
              Icon(Icons.info, color: statusColor),
              const SizedBox(width: 8),
              const Text("Leave Status"),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                cuti.keterangan,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              Text(
                "Status: ${cuti.status}",
                style: TextStyle(
                  color: statusColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 5),
              Text("Approved by: ${cuti.disetujuiOleh}"),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("OK"),
            ),
          ],
        );
      },
    );
  }
}

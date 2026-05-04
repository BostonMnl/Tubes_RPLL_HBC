import 'package:flutter/material.dart';
import 'package:mobile/data/model/reimbursement.dart';
import 'package:mobile/data/api/api_services.dart';
import 'package:mobile/data/auth/auth_storage.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class ReimbursementScreen extends StatefulWidget {
  const ReimbursementScreen({super.key});

  @override
  State<ReimbursementScreen> createState() => _ReimbursementScreenState();
}

class _ReimbursementScreenState extends State<ReimbursementScreen> {
  List<Reimbursement> data = [];
  bool isLoading = true;
  bool isSubmitting = false;

  final TextEditingController descriptionController = TextEditingController();
  final TextEditingController amountController = TextEditingController();

  File? selectedImage;
  DateTime? selectedDate;

  final ImagePicker picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    loadReimburse();
  }

  Future<void> loadReimburse() async {
    try {
      final token = await AuthStorage.getToken();
      if (token == null) throw Exception("Token tidak ada");

      final res = await ApiServices.getMyReimburse(token);

      setState(() {
        data = res;
        isLoading = false;
      });
    } catch (e) {
      print(e);
      setState(() => isLoading = false);
    }
  }

  Future<void> pickImage() async {
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        selectedImage = File(image.path);
      });
    }
  }

  Future<void> pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );

    if (picked != null) {
      setState(() {
        selectedDate = picked;
      });
    }
  }

  Color getStatusColor(String status) {
    switch (status) {
      case 'Approved':
        return Colors.green;
      case 'Rejected':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  Future<void> submitReimburse() async {
    if (descriptionController.text.isEmpty ||
        amountController.text.isEmpty ||
        selectedImage == null ||
        selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lengkapi semua data')),
      );
      return;
    }

    setState(() => isSubmitting = true);

    try {
      final token = await AuthStorage.getToken();
      if (token == null) throw Exception("Token tidak ada");

      await ApiServices.createReimburse(
        token: token,
        keterangan: descriptionController.text,
        nominal: int.parse(amountController.text),
        gambar: selectedImage!,
        tanggal: selectedDate!,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Berhasil submit reimburse')),
      );

      descriptionController.clear();
      amountController.clear();
      selectedImage = null;
      selectedDate = null;

      Navigator.pop(context);

      // reload data
      await loadReimburse();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => isSubmitting = false);
    }
  }

  void _showForm() {
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
              const Text(
                'Add Reimbursement',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 15),

              // DESCRIPTION
              TextField(
                controller: descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
              ),

              const SizedBox(height: 10),

              // AMOUNT
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Amount'),
              ),

              const SizedBox(height: 15),

              // DATE PICKER
              GestureDetector(
                onTap: pickDate,
                child: Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.pink),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    selectedDate == null
                        ? "Select Date"
                        : selectedDate.toString().split(" ")[0],
                  ),
                ),
              ),

              const SizedBox(height: 15),

              // IMAGE PICKER
              GestureDetector(
                onTap: pickImage,
                child: Container(
                  height: 120,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.pink),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: selectedImage == null
                      ? const Center(child: Text('Tap to upload receipt'))
                      : Image.file(selectedImage!, fit: BoxFit.cover),
                ),
              ),

              const SizedBox(height: 20),

              // SUBMIT BUTTON
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isSubmitting ? null : submitReimburse,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.pink,
                  ),
                  child: isSubmitting
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Submit'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final baseUrl = "http://192.168.1.6:3000";

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Reimbursement',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.pink,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: data.length,
              itemBuilder: (context, index) {
                final item = data[index];

                return Card(
                  margin: const EdgeInsets.all(10),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: getStatusColor(item.status),
                      child:
                          const Icon(Icons.receipt, color: Colors.white),
                    ),
                    title: Text(item.description),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                            'Amount: Rp ${item.amount.toStringAsFixed(0)}'),
                        Text(
                            'Date: ${item.date.toString().substring(0, 10)}'),
                        Text(
                          item.status,
                          style: TextStyle(
                              color: getStatusColor(item.status)),
                        ),

                        // IMAGE
                        if (item.receiptImage.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Image.network(
                              "$baseUrl${item.receiptImage}",
                              height: 100,
                              fit: BoxFit.cover,
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.pink,
        onPressed: _showForm,
        child: const Icon(Icons.add),
      ),
    );
  }
}
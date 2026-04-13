import 'package:flutter/material.dart';
import 'package:mobile/model/reimbursement.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class ReimbursementScreen extends StatefulWidget {
  const ReimbursementScreen({super.key});

  @override
  State<ReimbursementScreen> createState() => _ReimbursementScreenState();
}

class _ReimbursementScreenState extends State<ReimbursementScreen> {
  final List<Reimbursement> data = [
    Reimbursement(
      reimbursementId: '1',
      userId: 'U001',
      description: 'Transport Taxi',
      amount: 50000,
      receiptImage: '',
      status: 'Approved',
      date: DateTime.now(),
    ),
  ];

  final TextEditingController descriptionController = TextEditingController();
  final TextEditingController amountController = TextEditingController();

  File? selectedImage;

  final ImagePicker picker = ImagePicker();

  Future<void> pickImage() async {
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        selectedImage = File(image.path);
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
              TextField(
                controller: descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Amount'),
              ),
              const SizedBox(height: 20),

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

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (descriptionController.text.isEmpty ||
                        amountController.text.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Fill all fields')),
                      );
                      return;
                    }

                    setState(() {
                      data.add(
                        Reimbursement(
                          reimbursementId: DateTime.now().toString(),
                          userId: 'U001',
                          description: descriptionController.text,
                          amount: double.parse(amountController.text),
                          receiptImage: '',
                          status: 'Pending',
                          date: DateTime.now(),
                        ),
                      );
                    });

                    descriptionController.clear();
                    amountController.clear();

                    Navigator.pop(context);
                  },
                  child: const Text('Submit'),
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
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Reimbursement',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.pink,
      ),
      body: ListView.builder(
        itemCount: data.length,
        itemBuilder: (context, index) {
          final item = data[index];
          return Card(
            margin: const EdgeInsets.all(10),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: getStatusColor(item.status),
                child: const Icon(Icons.receipt, color: Colors.white),
              ),
              title: Text(item.description),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Amount: Rp ${item.amount.toStringAsFixed(0)}'),
                  Text('Date: ${item.date.toString().substring(0, 10)}'),
                  Text('User: ${item.userId}'),
                  Text(
                    item.status,
                    style: TextStyle(color: getStatusColor(item.status)),
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

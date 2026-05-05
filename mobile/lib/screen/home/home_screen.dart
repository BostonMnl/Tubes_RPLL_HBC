import 'package:flutter/material.dart';
import 'package:mobile/data/api/api_services.dart';
import 'package:mobile/data/model/attendanceRecord.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _token;
  Map<String, dynamic>? _profileData;

  List<AttendanceRecord> _allAttendance = [];
  List<AttendanceRecord> _filteredAttendance = [];

  bool _loadingProfile = true;

  final DateTime _now = DateTime.now();
  late int _selectedMonth;
  late int _selectedYear;

  final List<String> _months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  late final List<int> _years = List.generate(
    _now.year - 2020 + 2,
    (i) => 2020 + i,
  );

  @override
  void initState() {
    super.initState();
    _selectedMonth = _now.month;
    _selectedYear = _now.year;
    _init();
  }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    if (_token == null) return;
    await _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    try {
      final data = await ApiServices.getMyProfileFull(_token!);

      final List rawAttendance = data['attendance'] ?? [];
      final List<AttendanceRecord> attendanceList = rawAttendance.map((e) {
        return AttendanceRecord(
          date: e['date'] ?? '',
          status: e['status'] ?? '-',
          jamMasuk: e['jam_masuk'],
          jamKeluar: e['jam_keluar'],
          total: e['total'],
        );
      }).toList();

      // Hitung filter langsung tanpa setState ganda
      final filtered = attendanceList.where((record) {
        try {
          final parts = record.date.split('-');
          if (parts.length < 3) return false;
          final recYear  = int.parse(parts[0]);
          final recMonth = int.parse(parts[1]);
          return recYear == _selectedYear && recMonth == _selectedMonth;
        } catch (_) {
          return false;
        }
      }).toList();

      setState(() {
        _profileData = data;
        _allAttendance = attendanceList;
        _filteredAttendance = filtered;
        _loadingProfile = false;
      });
    } catch (e) {
      setState(() => _loadingProfile = false);
      debugPrint('Profile error: $e');
    }
  }

  // Dipanggil di dalam setState dari luar
  void _applyFilter() {
    _filteredAttendance = _allAttendance.where((record) {
      try {
        final parts = record.date.split('-');
        if (parts.length < 3) return false;
        final recYear  = int.parse(parts[0]);
        final recMonth = int.parse(parts[1]);
        return recYear == _selectedYear && recMonth == _selectedMonth;
      } catch (_) {
        return false;
      }
    }).toList();
  }

  String _formatRupiah(dynamic val) {
    if (val == null) return 'Rp -';
    final num = (val is int) ? val : int.tryParse(val.toString()) ?? 0;
    final str = num.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]}.',
    );
    return 'Rp $str';
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'hadir':  return Colors.green;
      case 'telat':  return Colors.orange;
      case 'alpha':  return Colors.red;
      default:       return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final user      = _profileData?['user'];
    final totalCuti = _profileData?['total_cuti'] ?? 0;
    final totalReim = _profileData?['total_reimburse'] ?? 0;
    final gaji      = _profileData?['gaji'] ?? 0;
    final String nama   = user?['nama'] ?? 'Karyawan';
    final String gambar = user?['gambar'] ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFFFFF0F5),
      appBar: AppBar(
        title: const Text(
          "Harapan Bangsa",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        automaticallyImplyLeading: false,
        backgroundColor: const Color(0xFFFF3D7F),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => Navigator.pushNamed(context, "/profile"),
            icon: gambar.isNotEmpty
                ? CircleAvatar(
                    radius: 16,
                    backgroundImage: NetworkImage("http://192.168.1.7:3000$gambar"),
                  )
                : const Icon(Icons.person, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 8),
        ],
      ),

      body: RefreshIndicator(
        color: const Color(0xFFFF3D7F),
        onRefresh: () async {
          setState(() => _loadingProfile = true);
          await _fetchProfile();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              // ── Greeting banner ──────────────────────────
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF6FA5), Color(0xFFFF3D7F)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFFF3D7F).withOpacity(0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundColor: Colors.white24,
                      backgroundImage: gambar.isNotEmpty
                          ? NetworkImage("http://192.168.1.7:3000$gambar")
                          : null,
                      child: gambar.isEmpty
                          ? const Icon(Icons.person, color: Colors.white, size: 32)
                          : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _loadingProfile ? 'Memuat...' : 'Halo, $nama 👋',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            user?['jabatan'] ?? '',
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // ── Stat cards ───────────────────────────────
              _loadingProfile
                  ? const Center(
                      child: CircularProgressIndicator(color: Color(0xFFFF3D7F)),
                    )
                  : Column(
                      children: [
                        Row(
                          children: [
                            _statCard(
                              icon: Icons.beach_access,
                              label: 'Cuti',
                              value: totalCuti.toString(),
                              color: const Color(0xFFFF6FA5),
                              bg: const Color(0xFFFFF0F5),
                              onTap: () => Navigator.pushNamed(context, "/leave"),
                            ),
                            _statCard(
                              icon: Icons.receipt_long,
                              label: 'Reimburse',
                              value: totalReim.toString(),
                              color: const Color(0xFFFF3D7F),
                              bg: const Color(0xFFFFE4EF),
                              onTap: () => Navigator.pushNamed(context, "/reimbursement"),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _statCard(
                              icon: Icons.account_balance_wallet,
                              label: 'Gaji',
                              value: _formatRupiah(gaji),
                              color: const Color(0xFFC2185B),
                              bg: const Color(0xFFFCE4EC),
                              onTap: () => Navigator.pushNamed(context, "/wage"),
                              fullWidth: true,
                            ),
                          ],
                        ),
                      ],
                    ),

              const SizedBox(height: 24),

              // ── Attendance header ─────────────────────────
              const Text(
                "Riwayat Absensi",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFFF3D7F),
                ),
              ),

              const SizedBox(height: 12),

              // ── Month / Year picker ───────────────────────
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      value: _selectedMonth,
                      decoration: InputDecoration(
                        labelText: "Bulan",
                        labelStyle: const TextStyle(color: Color(0xFFFF3D7F)),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFFFF6FA5)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(
                            color: Color(0xFFFF3D7F),
                            width: 2,
                          ),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                      ),
                      items: List.generate(
                        12,
                        (i) => DropdownMenuItem(
                          value: i + 1,
                          child: Text(_months[i]),
                        ),
                      ),
                      onChanged: (v) {
                        if (v == null) return;
                        setState(() {
                          _selectedMonth = v;
                          _applyFilter(); // ✅ dalam setState
                        });
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      value: _selectedYear,
                      decoration: InputDecoration(
                        labelText: "Tahun",
                        labelStyle: const TextStyle(color: Color(0xFFFF3D7F)),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(color: Color(0xFFFF6FA5)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: const BorderSide(
                            color: Color(0xFFFF3D7F),
                            width: 2,
                          ),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                      ),
                      items: _years
                          .map((y) => DropdownMenuItem(
                                value: y,
                                child: Text(y.toString()),
                              ))
                          .toList(),
                      onChanged: (v) {
                        if (v == null) return;
                        setState(() {
                          _selectedYear = v;
                          _applyFilter(); // ✅ dalam setState
                        });
                      },
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // ── Attendance list ───────────────────────────
              _loadingProfile
                  ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: CircularProgressIndicator(color: Color(0xFFFF3D7F)),
                      ),
                    )
                  : _filteredAttendance.isEmpty
                      ? Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            children: [
                              const Icon(
                                Icons.inbox,
                                size: 48,
                                color: Colors.pinkAccent,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                "Tidak ada absensi di "
                                "${_months[_selectedMonth - 1]} $_selectedYear",
                                style: const TextStyle(color: Colors.grey),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _filteredAttendance.length,
                          itemBuilder: (context, index) {
                            return _attendanceCard(_filteredAttendance[index]);
                          },
                        ),

              const SizedBox(height: 80),
            ],
          ),
        ),
      ),

      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFFFF3D7F),
        child: const Icon(Icons.qr_code_scanner, color: Colors.white),
        onPressed: () => Navigator.pushNamed(context, "/scanner"),
      ),
    );
  }

  // ─── Widgets ──────────────────────────────────────────

  Widget _statCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
    required Color bg,
    VoidCallback? onTap,
    bool fullWidth = false,
  }) {
    final card = InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.3)),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: color.withOpacity(0.8),
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: TextStyle(
                      color: color,
                      fontSize: fullWidth ? 20 : 18,
                      fontWeight: FontWeight.bold,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );

    return fullWidth
        ? Expanded(child: card)
        : Expanded(
            child: Padding(
              padding: const EdgeInsets.only(right: 8),
              child: card,
            ),
          );
  }

  Widget _attendanceCard(AttendanceRecord record) {
    final color = _statusColor(record.status);
    final parts = record.date.split('-');
    final day   = parts.length >= 3 ? parts[2] : record.date;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.pink.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Day circle
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                day,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ),
          ),

          const SizedBox(width: 14),

          // Detail
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  record.date,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    if (record.jamMasuk != null) ...[
                      const Icon(Icons.login, size: 13, color: Colors.grey),
                      const SizedBox(width: 3),
                      Text(
                        record.jamMasuk!,
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      const SizedBox(width: 10),
                    ],
                    if (record.jamKeluar != null) ...[
                      const Icon(Icons.logout, size: 13, color: Colors.grey),
                      const SizedBox(width: 3),
                      Text(
                        record.jamKeluar!,
                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ],
                ),
                if (record.total != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    "Total: ${record.total}",
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ],
            ),
          ),

          // Status badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              record.status,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
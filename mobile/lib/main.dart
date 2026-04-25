import 'package:flutter/material.dart';
import 'package:mobile/data/auth/auth_storage.dart';
import 'package:mobile/screen/forgot_password/forgot_password_screen.dart';
import 'package:mobile/screen/home/home_screen.dart';
import 'package:mobile/screen/home/scanner_screen.dart';
import 'package:mobile/screen/leave/leave_screen.dart';
import 'package:mobile/screen/login/login_screen.dart';
import 'package:mobile/screen/profil/edit_profile_screen.dart';
import 'package:mobile/screen/profil/profile_screen.dart';
import 'package:mobile/screen/reimbursement/reimbursement_screen.dart';
import 'package:mobile/screen/wage/wage_screen.dart';
import 'package:mobile/static/navigation_route.dart';
import 'package:mobile/style/thema.dart';




void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {

  Widget _startScreen = const Scaffold(
    body: Center(child: CircularProgressIndicator()),
  );
  @override
  void initState() {
    super.initState();
    _checkLogin();
  }

Future<void> _checkLogin() async {
  final token = await AuthStorage.getToken();

  print("TOKEN DI START: $token");

  if (!mounted) return;

  if (token != null && token.isNotEmpty) {
    setState(() {
      _startScreen = const HomeScreen();
    });
  } else {
    setState(() {
      _startScreen = const LoginScreen();
    });
  }
}

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mobile HBC',
      home: _startScreen,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routes:{
        NavigationRoute.homeRoute.name: (context) => const HomeScreen(),
        NavigationRoute.profile.name: (context) => const ProfileScreen(),
        NavigationRoute.leave.name: (context) => const LeaveScreen(),
        NavigationRoute.login.name: (context) => const LoginScreen(),
        NavigationRoute.scanner.name: (context) => const ScannerScreen(),
        NavigationRoute.reimbursement.name: (context) => const ReimbursementScreen(),
        NavigationRoute.wage.name: (context) => const WageScreen(),
        NavigationRoute.forgotPassword.name: (context) => const ForgotPasswordScreen(),
        NavigationRoute.editProfile.name: (context) => const EditProfileScreen(),
      }
      );
  } 
}

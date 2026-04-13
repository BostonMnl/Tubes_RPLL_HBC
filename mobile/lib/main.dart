import 'package:flutter/material.dart';
import 'package:mobile/screen/home/home_screen.dart';
import 'package:mobile/screen/home/scanner_screen.dart';
import 'package:mobile/screen/leave/leave_screen.dart';
import 'package:mobile/screen/login/login_screen.dart';
import 'package:mobile/screen/profil/profile_screen.dart';
import 'package:mobile/screen/reimbursement/reimbursement_screen.dart';
import 'package:mobile/screen/wage/wage_screen.dart';
import 'package:mobile/static/navigation_route.dart';
import 'package:mobile/style/thema.dart';


void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mobile HBC',
      home: const LoginScreen(),
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
      }
      );
  } 
}

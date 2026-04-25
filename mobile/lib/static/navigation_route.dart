enum NavigationRoute {
  homeRoute("/home"),
  login("/login"),
  profile("/profile"),
  leave("/leave"),
  reimbursement("/reimbursement"),
  wage("/wage"), 
  scanner("/scanner"),
  forgotPassword("/forgot-password"),
  editProfile("/edit-profile");

  const NavigationRoute(this.name);
  final name;
}
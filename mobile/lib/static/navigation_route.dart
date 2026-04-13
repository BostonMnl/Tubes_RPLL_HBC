enum NavigationRoute {
  homeRoute("/home"),
  login("/login"),
  profile("/profile"),
  leave("/leave"),
  reimbursement("/reimbursement"),
  wage("/wage"), 
  scanner("/scanner");

  const NavigationRoute(this.name);
  final name;
}
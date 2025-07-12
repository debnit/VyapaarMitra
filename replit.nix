
{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.npm-9_x
    pkgs.postgresql
    pkgs.redis
  ];
}

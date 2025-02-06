let
  nixpkgs = fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/nixos-23.11.tar.gz";
  };
  pkgs = import nixpkgs {};
in
pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_20  
    nodePackages.npm
  ];
}
{
  description = "A very basic flake";

  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }: flake-utils.lib.eachDefaultSystem (system:
  let
    pkgs = nixpkgs.legacyPackages.${system};
    lib = nixpkgs.lib;
    tools = builtins.map (tool: tool.name) (lib.importTOML ./tools.toml).tools;
  in rec {
    packages = lib.genAttrs tools (name:
    pkgs.stdenv.mkDerivation { 
      inherit name;
      src = ./build + "/${name}";
  
      nativeBuildInputs = with pkgs; [ makeWrapper ];

      buildPhase = ":";
      installPhase = ''
        mkdir -p $out/opt/${name}
        mv * $out/opt/${name}
        makeWrapper ${pkgs.nwjs}/bin/nw $out/bin/${name} --add-flags $out/opt/${name}
      '';
    });
     
    apps = lib.genAttrs tools (name: flake-utils.lib.mkApp { drv = packages."${name}"; });
    devShell = pkgs.mkShell { buildInputs = with pkgs; [nodejs yarn nodePackages.gulp]; };
  }
  );
}

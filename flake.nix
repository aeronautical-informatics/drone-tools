{
  description = "A very basic flake";

  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachSystem [ "i686-linux" "x86_64-linux" ] (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        lib = nixpkgs.lib;
        tools = (lib.importTOML ./tools.toml).tools;
        nodejs = pkgs.nodejs-10_x;  
      in
      rec {
        packages = builtins.listToAttrs (builtins.map
          (tool:
            let
              name = tool.name;
              desktopItem = pkgs.makeDesktopItem {
                inherit name;
                exec = name;
                icon = name;
                comment = tool.comment;
                desktopName = tool.desktop_name;
              };
              pkg = pkgs.stdenv.mkDerivation {
                inherit name;
                src = ./build + "/${name}.tar.zst";

                nativeBuildInputs = with pkgs; [ makeWrapper zstd wrapGAppsHook ];

                buildPhase = ":";
                installPhase = ''
                  install -m 444 -D images/${tool.icon} $out/share/icons/hicolor/128x128/apps/${name}.png
                  mkdir -p $out/opt/${name}
                  mv * $out/opt/${name}
                  makeWrapper ${pkgs.nwjs}/bin/nw $out/bin/${name} --add-flags $out/opt/${name}
                  cp -r ${desktopItem}/share/applications $out/share/
                '';
              };
            in
            lib.nameValuePair name pkg)
          tools);

        apps = lib.genAttrs (builtins.map (t: t.name) tools)
          (name: flake-utils.lib.mkApp { drv = packages."${name}"; });

        checks = packages;

        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            git
            yq
            nodejs
            (yarn.override { inherit nodejs; })
            nodePackages.gulp
            zstd
          ];
          shellHook = ''
            SCRIPT_DIR="$(pwd)"

            get_property(){
              tomlq -r ".tools[] | select(.name==\"$1\").$2" "$SCRIPT_DIR/tools.toml"
            }

            mkdir -p repos

            while IFS= read -r name; do
              if [ -d "$SCRIPT_DIR/build/$name" ] 
              then
                echo "skipping $name"
                continue
              fi
              echo "building $name"
              url=$(get_property $name url)
              tag=$(get_property $name tag)
              srcdir="$SCRIPT_DIR/repos/$name"
              git clone $url $srcdir
              cd $srcdir
              git fetch --tags --force --all
              git reset --hard $tag
              for patch in ../../patches/$name/*.patch
              do
                git apply $patch 
              done
              yarn install 
              yarn gulp dist 
              mkdir -p "$SCRIPT_DIR/build"
              mv dist $name
              tar -cv $name | zstd --ultra -22 -T0 -o "$SCRIPT_DIR/build/$name.tar.zst"
            done< <(tomlq -r '.tools[].name' tools.toml)
            exit
          '';
        };
      });
}

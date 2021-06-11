#!/usr/bin/env nix-shell
#!nix-shell -i bash --packages coreutils git yq nodejs-10_x yarn


SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

get_property(){
	tomlq -r ".tools[] | select(.name==\"$1\").$2" "$SCRIPT_DIR/tools.toml"
}

tmp_dir=$(mktemp -d)

while IFS= read -r name; do
	echo "building $name"
	url=$(get_property $name url)
	tag=$(get_property $name tag)
	srcdir=${tmp_dir}/$name
	git clone $url $srcdir
	cd $srcdir
	git fetch --tags --force
	git checkout $tag
	yarn install 
	yarn gulp dist 
	mkdir -p "$SCRIPT_DIR/build"
	mv dist "$SCRIPT_DIR/build/$name"
	cd ..
	rm -rf "$name"
done< <(tomlq -r '.tools[].name' tools.toml)

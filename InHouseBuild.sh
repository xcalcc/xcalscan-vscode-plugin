#!/bin/bash

VERSION=$1
ROOT_DIR="$(pwd)"

sed -i 's/"version": "0.0.0"/"version": "'$VERSION'"/' package.json
sed -i 's/"version": "0.0.0"/"version": "'$VERSION'"/' package-lock.json


docker build -f InHouse.Dockerfile -t vscodeplugin_image:${VERSION} .
if [ $? != 0 ]; then
  echo "Build vsix failed."
  exit 1
fi

vscode_container="vscode_builder"
if docker ps -a | grep $vscode_container >/dev/null; then
  docker rm $vscode_container
fi

docker create --name $vscode_container vscodeplugin_image:${VERSION} &&
  docker cp $vscode_container:/home/sdlc/xcalscan-vscode-plugin-${VERSION}.vsix ${ROOT_DIR} &&
  docker rm -f $vscode_container

if [ $? != 0 ]; then
  echo "Copy vsix from container failed."
  exit 1
fi

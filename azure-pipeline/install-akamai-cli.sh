#!/bin/bash

echo 'Installing akamai CLI'
curl -Lo akamai https://github.com/akamai/cli/releases/download/v1.5.5/akamai-v1.5.5-linuxamd64
chmod 755 ./akamai
./akamai install edgeworkers --force
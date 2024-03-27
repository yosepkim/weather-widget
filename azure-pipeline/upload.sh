#!/bin/bash

echo 'Setting up .edgerc'
echo -e "[default]\nhost=${AKAMAI_HOST}\nclient_token=${AKAMAI_CLIENT_TOKEN}\naccess_token=${AKAMAI_ACCESS_TOKEN}\nclient_secret=${AKAMAI_CLIENT_SECRET}" > ~/.edgerc

echo 'Setting up EdgeKV token file'
sed -e "s/#EDGEKV_TOKEN#/${AKAMAI_EDGE_TOKEN}/g" ./edgekv_tokens.template.js > ./edgekv_tokens.js

echo 'Building a deployment tarball'
tar cvzf tarball.tgz main.js bundle.json edgekv.js edgekv_tokens.js services

echo 'Uploading EdgeWorker'
./akamai --accountkey ${ACCOUNT_KEY} edgeworkers upload --bundle tarball.tgz ${EW_ID} 

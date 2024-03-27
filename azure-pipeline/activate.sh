#!/bin/bash

echo -e 'Setting up .edgerc'
echo -e "[default]\nhost=${AKAMAI_HOST}\nclient_token=${AKAMAI_CLIENT_TOKEN}\naccess_token=${AKAMAI_ACCESS_TOKEN}\nclient_secret=${AKAMAI_CLIENT_SECRET}" > ~/.edgerc

VERSION=$(grep "edgeworker-version" bundle.json | grep -Eo '[0-9\.]+')
echo -e 'Activating ${TARGET_ENV}'
./akamai edgeworkers activate ${EW_ID} ${TARGET_ENV} ${VERSION} --accountkey ${ACCOUNT_KEY}
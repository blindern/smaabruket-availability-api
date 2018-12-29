#!/bin/sh
set -eu

tag=$(cat .dockertag)

echo "Running remote SSH-script"

ssh -o StrictHostKeyChecking=no core@coreos-1.foreningenbs.no /bin/bash << EOF
  set -eu
  cd /data/drift/services/smaabruket-availability-api
  ./deploy.sh $tag
EOF

echo "Deploy finished"

#!/bin/sh
set -eu

>&2 echo "Automated deploy currently disabled"
>&2 echo "Would have deployed $(cat .dockertag) if enabled"
exit

tag=$(cat .dockertag)

echo "Running remote SSH-script"

ssh -o StrictHostKeyChecking=no core@coreos-1.foreningenbs.no /bin/bash << EOF
  set -eu
  cd /data/drift/services/smaabruket-availability-api
  ./deploy.sh $tag
EOF

echo "Deploy finished"

#!/bin/sh
set -eu

docker --version

extra=""
if [ "$CIRCLE_BRANCH" != "master" ]; then
  extra="-$(echo "$CIRCLE_BRANCH" | sed 's/[^a-zA-Z0-9\-]//g')"
fi

repo="blindern/smaabruket-availability-api"
tag="$(date -u +%Y%m%d-%H%M)$extra-$CIRCLE_BUILD_NUM"

echo $repo >.dockerrepo
echo $tag >.dockertag

# Pull latest image and use as cache
docker pull $repo:latest || :

docker build --pull --cache-from $repo:latest -t $repo:$tag .

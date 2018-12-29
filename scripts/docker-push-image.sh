#!/bin/sh
set -eu

repo=$(cat .dockerrepo)
tag=$(cat .dockertag)

echo "Pusing to $repo:$tag"
docker push $repo:$tag

if [ "$CIRCLE_BRANCH" = "master" ]; then
  echo "On master - pushing to latest as well"
  docker tag $repo:$tag $repo:latest
  docker push $repo:latest
fi

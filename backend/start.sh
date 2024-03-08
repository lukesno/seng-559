#!/bin/bash

echo "Starting load balancer"
(cd load-balancer && npm run start) &

echo "Starting process server1"
(cd process && npm run start) &

# echo "Starting process server2"
# (cd process && npm run start) &

wait
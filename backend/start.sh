#!/bin/bash

echo "Starting load balancer"
(cd load-balancer && npm run start) &

echo "Starting process server1"
(cd process && npm run start:3001) &

echo "Starting process server2"
(cd process && npm run start:3002) &

wait
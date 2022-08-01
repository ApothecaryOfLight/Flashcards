#!/bin/bash
cd "${0%/*}"
if [[ "$1" = "http" ]];
then
  ip=$(curl https://api.ipify.org?format=text)
  echo "const ip = \"http://${ip}:3001\/\";" > ./frontend/ip_file.js
  cd backend && screen -d -m -S Flashcards bash -c './run.sh http "$ip"'
elif [[ "$1" = "https" ]];
then
  echo "const ip = \"https://triviacards.net:3001\/\";" > ./frontend/ip_file.js
  cd backend && screen -d -m -S Flashcards bash -c './run.sh https'
else
  echo "Command line argument:";
  echo "  run.sh dev";
  echo "    Will run Flashcards without an SSL/TSL Certificates.";
  echo "  run.sh prod";
  echo "    Will run Flashcards with SSL/TSL Certificates.";
  exit -1
fi


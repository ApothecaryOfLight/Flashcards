#!/bin/bash
cd "${0%/*}"
if [[ "$1" = "http" ]];
then
  IP=$(hostname -I | xargs)
  echo "const ip = \"ws://${IP}:3001\";" > ./frontend/ip_file.js
elif [[ "$1" = "https" ]];
then
  echo "const ip = \"wss://triviacards.net:3001\";" > ./frontend/ip_file.js
else
  echo "Command line argument:";
  echo "  run.sh dev";
  echo "    Will run Flashcards without an SSL/TSL Certificates.";
  echo "  run.sh prod";
  echo "    Will run Flashcards with SSL/TSL Certificates.";
  exit -1
fi

cd backend && screen -d -m -S Flashcards bash -c './run.sh "$1"'

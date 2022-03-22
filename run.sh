#!/bin/bash
if [[ "$1" = "dev" ]];
then
  IP=$(hostname -I | xargs)
  echo "const ip = \"ws://${IP}:8001\";" > ./frontend/ip_file.sh
elif [[ "$1" = "prod" ]];
then
  echo "const ip = \"wss://triviacards.net:8001\";" > ./frontend/ip_file.sh
else
  echo "Command line argument:";
  echo "  run.sh dev";
  echo "    Will run Flashcards without an SSL/TSL Certificates.";
  echo "  run.sh prod";
  echo "    Will run Flashcards with SSL/TSL Certificates.";
  exit -1
fi

cd backend && screen -d -m -S Flashcards bash -c './run.sh "$1"'

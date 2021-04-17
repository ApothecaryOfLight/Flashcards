#!/bin/bash

echo -n "Initial setup? (y/n)"
read prompt
if [ "$prompt" != "${prompt#[Yy]}" ] ;then
  sudo apt-get upgrade -y sudo apt-get update -y

  #==NODEJS==
  curl -sL https://deb.nodesource.com/setup_15.x | sudo -E bash -
  sudo apt-get install -y nodejs


  #==MYSQL==
  sudo apt install mysql-server -y
  # TODO: Get this script to run without user input
  sudo mysql_secure_installation


  #==NGINX==
  sudo apt-get install nginx -y
  sudo ufw allow 'Nginx HTTP'
  sudo ufw allow ssh
  sudo ufw allow 3000
  sudo ufw enable
  cd /etc/nginx/sites-enabled && sudo sed -i "s/root \/var\/www\/html;/root \/home\/ubuntu\/Flashcards\/frontend;/g" default
  sudo systemctl restart nginx
fi

#==Format SQL Database==
echo -n "Format SQL database? (y/n)"
read prompt
if [ "$prompt" != "${prompt#[Yy]}" ] ;then
  ./create_schema.sh
  sudo mysql < create_schema.sh
fi

#==HTTPS==
echo -n "Set up HTTPS? (y/n)"
read prompt
if [ "$prompt" != "${prompt#[Yy]}" ] ;then
  echo "Setting up HTTPS."
  sudo apt-get install certbot
  sudo apt-get install python3-certbot-nginx
  sudo certbot --nginx
  sudo ufw allow https
  screen -d -m -S backend bash -c 'cd backend && npm i && ./run-https.sh'
else
  echo "Not setting up HTTPS."
  screen -d -m -S backend bash -c 'cd backend && npm i && ./run-http.sh'
fi




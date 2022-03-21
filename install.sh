if [[ "$1" = "standalone" ]];
then
  #==NODEJS==
  sudo apt-get install -y nodejs
  sudo apt-get install -y npm

  #==MYSQL==
  sudo apt install mysql-server -y
  # TODO: Get this script to run without user input
  sudo mysql_secure_installation

  #==mySQL Schema==
  ./create_schema.sh
  sudo mysql < create_schema.sh

  #==NGINX==
  sudo apt-get install nginx -y
  sudo ufw allow 'Nginx HTTP'
  sudo ufw allow ssh
  sudo ufw allow 3000
  sudo ufw enable
  sudo systemctl restart nginx

  #==NPM Packages==
  cd backend && npm i
elif [[ "$1" = "unified" ]];
then
  #==mySQL Schema==
  ./create_schema.sh
  sudo mysql < create_schema.sh

  #==NPM Packages==
  cd backend && npm i
else
  echo "Command line argument:";
  echo "  install.sh standalone";
  echo "    Will install Flashcards with all dependencies";
  echo "  install.sh unified";
  echo "    Will install just Flashcards with no dependencies.";
fi

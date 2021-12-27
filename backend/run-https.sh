echo "const ip = 'https://triviacards.net:3001/';" > ../frontend/ip_file.js
npx nodemon --watch . main.js https

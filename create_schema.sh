rm create_schema.sql
echo "DROP DATABASE IF EXISTS Flashcards;" >> "create_schema.sql"
echo "CREATE DATABASE Flashcards;" >> "create_schema.sql"
echo "USE Flashcards;" >> "create_schema.sql"
echo "CREATE TABLE sets( name VARCHAR(150), set_id INT, PRIMARY KEY(set_id), subject VARCHAR(150) );" >> "create_schema.sql"
echo "CREATE TABLE cards( card_id INT, PRIMARY KEY(card_id), question TEXT, answer TEXT, set_id INT, FOREIGN KEY (set_id) REFERENCES sets(set_id) );" >> "create_schema.sql"
echo "CREATE TABLE users( user_id INT, PRIMARY KEY(user_id), username_hash VARBINARY(64), password_hash VARBINARY(64), last_session INT );" >> "create_schema.sql"
echo "CREATE TABLE score( user_id INT, FOREIGN KEY (user_id) REFERENCES users(user_id), card_id INT, FOREIGN KEY (card_id) REFERENCES cards(card_id), session_id INT, PRIMARY KEY( user_id, card_id, session_id ), passed TINYINT );" >> "create_schema.sql"

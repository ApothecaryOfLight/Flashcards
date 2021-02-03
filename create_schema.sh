echo "CREATE TABLE cards( card_id INT, PRIMARY KEY(id), question TEXT, answer TEXT );" >> "create_schema.sql"
echo "CREATE TABLE users( user_id INT, PRIMARY KEY(user_id), username_hash VARBINARY(64), password_hash VARBINARY(64), last_session INT );" >> "create_schema.sql"
echo "CREATE TABLE score( user_id INT, FOREIGN KEY (user_id) REFERENCES users(user_id), card_id INT, FOREIGN KEY (card_id) REFERENCES cards(card_id), session_id INT, PRIMARY KEY( user_id, card_id, session_id ), passed TINYINT );" >> "create_schema.sql"

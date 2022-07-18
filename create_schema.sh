rm create_schema.sql
echo "DROP DATABASE IF EXISTS Flashcards;" >> "create_schema.sql"
echo "CREATE DATABASE Flashcards;" >> "create_schema.sql"
echo "USE Flashcards;" >> "create_schema.sql"
echo "CREATE TABLE sets( name VARCHAR(150), set_id INT, PRIMARY KEY(set_id), subject VARCHAR(150), set_creator VARBINARY(64) );" >> "create_schema.sql"
echo "CREATE TABLE cards( card_id INT, PRIMARY KEY(card_id), question TEXT, answer TEXT, set_id INT, FOREIGN KEY (set_id) REFERENCES sets(set_id) ON DELETE CASCADE );" >> "create_schema.sql"
echo "CREATE TABLE users( username_hash VARBINARY(64), password_hash VARBINARY(64), PRIMARY KEY(username_hash) );" >> "create_schema.sql"
echo "CREATE TABLE tags( name VARCHAR(150), set_id INT, FOREIGN KEY (set_id) REFERENCES sets(set_id) ON DELETE CASCADE, card_id INT, FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE );" >> "create_schema.sql"

echo "CREATE TABLE card_search_text( name VARCHAR(150), card_id INT, FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE );" >> "create_schema.sql"
echo "CREATE TABLE card_search_topics( name VARCHAR(150), card_id INT, FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE );" >> "create_schema.sql"
echo "CREATE TABLE cardset_search_text( name VARCHAR(150), set_id INT, FOREIGN KEY (set_id) REFERENCES sets(set_id) ON DELETE CASCADE );" >> "create_schema.sql"
echo "CREATE TABLE cardset_search_topics( name VARCHAR(150), set_id INT, FOREIGN KEY (set_id) REFERENCES sets(set_id) ON DELETE CASCADE );" >> "create_schema.sql"

echo "CREATE TABLE images_registry( card_id INT NOT NULL, set_id INT NOT NULL, global_image_id INT NOT NULL, image_place INT NOT NULL, file_location TEXT NOT NULL, image_array_location INT NOT NULL, PRIMARY KEY( global_image_id ), INDEX( card_id, image_place ) );" >> "create_schema.sql"

echo "CREATE TABLE error_log( error_id INT NOT NULL, PRIMARY KEY(error_id), timestamp DATETIME(6) NOT NULL, ip TINYTEXT, source VARCHAR(256), details TEXT );" >> "create_schema.sql"
echo "CREATE TABLE event_log( event_id INT NOT NULL, PRIMARY KEY(event_id), timestamp DATETIME(6) NOT NULL, ip TINYTEXT, code_source VARCHAR(256), details TEXT );" >> "create_schema.sql"


#echo "CREATE TABLE score( user_id INT, FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE, card_id INT, FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE, session_id INT, PRIMARY KEY( user_id, card_id, session_id ), passed TINYINT );" >> "create_schema.sql"
echo "CREATE USER IF NOT EXISTS 'Flashcards_User'@'localhost' IDENTIFIED BY 'Flashcards_Password';" >> "create_schema.sql"
echo "GRANT ALL ON Flashcards.* TO 'Flashcards_User'@'localhost';" >> "create_schema.sql"


#Identity manager
echo "CREATE TABLE sequence_last( sequence_id TINYINT, last BIGINT NOT NULL );" >> create_schema.sql
echo "CREATE TABLE sequence_retired( sequence_id TINYINT, retired_id BIGINT NOT NULL );" >> create_schema.sql
echo "INSERT INTO sequence_last (sequence_id,last) VALUES (0,0);" >> create_schema.sql
echo "INSERT INTO sequence_last (sequence_id,last) VALUES (1,0);" >> create_schema.sql
echo "INSERT INTO sequence_last (sequence_id,last) VALUES (2,0);" >> create_schema.sql
echo "INSERT INTO sequence_last (sequence_id,last) VALUES (3,0);" >> create_schema.sql
echo "INSERT INTO sequence_last (sequence_id,last) VALUES (4,0);" >> create_schema.sql
echo "INSERT INTO sequence_last (sequence_id,last) VALUES (5,0);" >> create_schema.sql


#Card record
echo "CREATE TABLE card_record( username_hash VARBINARY(64), card_id INT, FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE, datestamp DATE, result INT );" >> create_schema.sql

#Identity manager function
echo "DELIMITER %%" >> create_schema.sql
echo "CREATE FUNCTION Flashcards.generate_new_id( in_sequence_id TINYINT )" >> create_schema.sql
echo "RETURNS BIGINT" >> create_schema.sql
echo "NOT DETERMINISTIC" >> create_schema.sql
echo "CONTAINS SQL" >> create_schema.sql
echo "READS SQL DATA" >> create_schema.sql
echo "BEGIN" >> create_schema.sql
echo "DECLARE RetiredID BIGINT;" >> create_schema.sql
echo "DECLARE LastID BIGINT;" >> create_schema.sql
echo "SET @RetiredID = (SELECT retired_id FROM sequence_retired WHERE sequence_id = in_sequence_id LIMIT 1);" >> create_schema.sql
echo "SET @LastID = (SELECT last FROM sequence_last WHERE sequence_id = in_sequence_id LIMIT 1);" >> create_schema.sql
echo "IF @RetiredID IS NULL THEN UPDATE sequence_last SET last = last + 1 WHERE sequence_id = in_sequence_id;" >> create_schema.sql
echo "ELSE DELETE FROM sequence_retired WHERE retired_id = @RetiredID AND sequence_id = in_sequence_id;" >> create_schema.sql
echo "END IF;" >> create_schema.sql
echo "SET @NewID = COALESCE( @RetiredID, @LastID );" >> create_schema.sql
echo "RETURN @NewID;" >> create_schema.sql
echo "END" >> create_schema.sql
echo "%%" >> create_schema.sql
echo "DELIMITER ;" >> create_schema.sql

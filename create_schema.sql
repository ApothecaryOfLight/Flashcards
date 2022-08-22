DROP DATABASE IF EXISTS Flashcards;
CREATE DATABASE Flashcards;
USE Flashcards;

CREATE USER IF NOT EXISTS 'Flashcards_User'@'localhost' IDENTIFIED BY 'Flashcards_Password';
GRANT ALL ON Flashcards.* TO 'Flashcards_User'@'localhost';

CREATE TABLE sets( name VARCHAR(150), set_id INT, PRIMARY KEY(set_id), subject VARCHAR(150), set_creator VARBINARY(64) );
CREATE TABLE cards( card_id INT, PRIMARY KEY(card_id), question TEXT, answer TEXT, set_id INT, FOREIGN KEY (set_id) REFERENCES sets(set_id) ON DELETE CASCADE );
CREATE TABLE users( username_hash VARBINARY(64), password_hash VARBINARY(64), PRIMARY KEY(username_hash) );
CREATE TABLE tags( name VARCHAR(150), set_id INT, FOREIGN KEY (set_id) REFERENCES sets(set_id) ON DELETE CASCADE, card_id INT, FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE );

CREATE TABLE search_table( name VARCHAR(150), INDEX (name), card_id INT, FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE, set_id INT, FOREIGN KEY (set_id) REFERENCES sets(set_id) ON DELETE CASCADE );

CREATE TABLE images_registry( card_id INT NOT NULL, set_id INT NOT NULL, global_image_id INT NOT NULL, image_place INT NOT NULL, file_location TEXT NOT NULL, image_array_location INT NOT NULL, PRIMARY KEY( global_image_id ), INDEX( card_id, image_place ) );

CREATE TABLE error_log( error_id INT NOT NULL, PRIMARY KEY(error_id), timestamp DATETIME(6) NOT NULL, ip TINYTEXT, source VARCHAR(256), details TEXT );
CREATE TABLE event_log( event_id INT NOT NULL, PRIMARY KEY(event_id), timestamp DATETIME(6) NOT NULL, ip TINYTEXT, code_source VARCHAR(256), details TEXT );

CREATE TABLE subject_level_listing (name VARCHAR(150) NOT NULL, subject_id INT NOT NULL PRIMARY KEY, level TINYINT NOT NULL, parent_id INT, INDEX lookup_by_level_and_parent_index (parent_id, level), INDEX lookup_by_level (level), FOREIGN KEY (parent_id) REFERENCES subject_level_listing(subject_id) ON DELETE CASCADE);
CREATE TABLE subject_set_listing ( set_id INT NOT NULL, PRIMARY KEY (set_id), FOREIGN KEY (set_id) REFERENCES sets(set_id) ON DELETE CASCADE, 1_level_subject_id INT, FOREIGN KEY (1_level_subject_id) REFERENCES subject_level_listing(subject_id) ON DELETE CASCADE, 2_level_subject_id INT, FOREIGN KEY (2_level_subject_id) REFERENCES subject_level_listing(subject_id) ON DELETE CASCADE, 3_level_subject_id INT, FOREIGN KEY (3_level_subject_id) REFERENCES subject_level_listing(subject_id) ON DELETE CASCADE, 4_level_subject_id INT, FOREIGN KEY (4_level_subject_id) REFERENCES subject_level_listing(subject_id) ON DELETE CASCADE, INDEX subject_set_listing_lookup_index( 1_level_subject_id, 2_level_subject_id, 3_level_subject_id, 4_level_subject_id ) );

CREATE TABLE card_record( username_hash VARBINARY(64), card_id INT, FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE, datestamp DATE, result INT );

CREATE TABLE sequence_last( sequence_id TINYINT, last BIGINT NOT NULL );
CREATE TABLE sequence_retired( sequence_id TINYINT, retired_id BIGINT NOT NULL );
INSERT INTO sequence_last (sequence_id,last) VALUES (0,0);
INSERT INTO sequence_last (sequence_id,last) VALUES (1,0);
INSERT INTO sequence_last (sequence_id,last) VALUES (2,0);
INSERT INTO sequence_last (sequence_id,last) VALUES (3,0);
INSERT INTO sequence_last (sequence_id,last) VALUES (4,0);
INSERT INTO sequence_last (sequence_id,last) VALUES (5,0);
INSERT INTO sequence_last (sequence_id,last) VALUES (6,0);

DELIMITER %%
CREATE FUNCTION Flashcards.generate_new_id( in_sequence_id TINYINT )
RETURNS BIGINT
NOT DETERMINISTIC
CONTAINS SQL
READS SQL DATA
BEGIN
DECLARE RetiredID BIGINT;
DECLARE LastID BIGINT;
SET @RetiredID = (SELECT retired_id FROM sequence_retired WHERE sequence_id = in_sequence_id LIMIT 1);
SET @LastID = (SELECT last FROM sequence_last WHERE sequence_id = in_sequence_id LIMIT 1);
IF @RetiredID IS NULL THEN UPDATE sequence_last SET last = last + 1 WHERE sequence_id = in_sequence_id;
ELSE DELETE FROM sequence_retired WHERE retired_id = @RetiredID AND sequence_id = in_sequence_id;
END IF;
SET @NewID = COALESCE( @RetiredID, @LastID );
RETURN @NewID;
END
%%
DELIMITER ;
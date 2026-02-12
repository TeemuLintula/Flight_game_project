import mysql.connector


#Kysyy käyttäjä tiedot ja muodostaa yhteyden tietokantaan
print("Tervetuloa lentopeliin")
tietokanta_kayttaja = input("Enter MariaDB username: ")
tietokanta_salasana = input("Enter MariaDB password: ")
global yhteys
yhteys = mysql.connector.connect(
host="localhost",
port = 3306,
user= tietokanta_kayttaja,
password= tietokanta_salasana,
database="flight_game",
autocommit=True
)
print(f"Kirjaudutaan tietokantaan käyttäjällä {tietokanta_kayttaja}")
global name
name = input("Kerro nimesi: ")

sql_usernamecheck = "SELECT screen_name FROM game WHERE screen_name = %s"
cursor = yhteys.cursor()
cursor.execute(sql_usernamecheck, (name,))

result = cursor.fetchone()
if not result:
     cursor.execute("ALTER TABLE game MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT")
     sql = "INSERT INTO game (screen_name) VALUES (%s)"
     cursor.execute(sql, (name,))
     print(f"Uusi pelaaja {name} luotu tietokantaan")
else:
    print(f"Tervetuloa takaisin {name}!")
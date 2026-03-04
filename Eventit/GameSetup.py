import mysql.connector
from Eventit import LORE
from mysql.connector import Error
print("Tervetuloa lentopeliin")
#Kysyy käyttäjä tiedot ja muodostaa yhteyden tietokantaan
while True:
     try:
          yhteys = mysql.connector.connect(
          host="localhost",
          port = 3306,
          user= input("Enter MariaDB username: "),
          password= input("Enter MariaDB password: "),
          database="flight_game",
          autocommit=True
          )
          if yhteys.is_connected():
               print("Yhteys onnistui!")
               break
          else: 
               print("Yhteys epäonnistui, yritä uudestaan.\n")
     except Error as e:
          print("Error while connecting to MariaDB check username and password: ", e)

print(f"Kirjaudutaan tietokantaan käyttäjällä {yhteys.user}...")
global name
name = input("Kerro nimesi: ")
cursor = yhteys.cursor()

cursor = yhteys.cursor()

# Tarkistaa onko pelaaja tietokannassa, jos ei ole luodaan uusi pelaaja
sql_usernamecheck = "SELECT screen_name FROM game WHERE screen_name = %s"
cursor = yhteys.cursor()
cursor.execute(sql_usernamecheck, (name,))
id_game = "SELECT id FROM game WHERE screen_name = %s"
cursor.execute(id_game, (name,))

result = cursor.fetchone()

if not result:
    sql = "INSERT INTO game (screen_name) VALUES (%s)"
    locaddsql = "UPDATE game SET location = 'EFHK', co2_budget = 10000, co2_consumed = 0 WHERE screen_name = %s"
    moneysetsql = "UPDATE game SET money = 1000 WHERE screen_name = %s"
    cursor.execute(sql, (name,))
    cursor.execute(locaddsql, (name,))
    cursor.execute(moneysetsql, (name,))
    yhteys.commit()
    print(f"Uusi pelaaja {name} luotu tietokantaan")
    LORE.lore()
else:
    print(f"Tervetuloa takaisin {name}!")
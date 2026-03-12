import mysql.connector
import sys
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

# Tarkistaa onko pelaaja tietokannassa, jos ei ole luodaan uusi pelaaja
cursor = yhteys.cursor()
id_game = "SELECT id FROM game WHERE screen_name = %s"
cursor.execute(id_game, (name,))

result = cursor.fetchone()

if not result:
    sql = "INSERT INTO game (screen_name) VALUES (%s)"
    locaddsql = "UPDATE game SET location = 'EFHK', co2_budget = 10000, co2_consumed = 0 WHERE screen_name = %s"
    moneysetsql = "UPDATE game SET money = 1000 WHERE screen_name = %s"
    basesetsql = "INSERT INTO game_home_base (game_id, base_ident) VALUES(%s,'EFHK')"
    addplanesql = "INSERT INTO airplane (game_id) VALUES(%s)"
    planesql = "UPDATE airplane SET ruuma = 1, moottori = 1, istuinpaikat = 1 WHERE game_id = %s"
    cursor.execute(sql, (name,))
    cursor.execute(locaddsql, (name,))
    cursor.execute(moneysetsql, (name,))
    yhteys.commit()
    cursor.execute(id_game, (name,))
    result = cursor.fetchone()
    cursor.execute(basesetsql, (result[0],))
    cursor.execute(addplanesql, (result[0],))
    cursor.execute(planesql, (result[0],))
    print(f"Uusi pelaaja {name} luotu tietokantaan")
    print("-------------------------------------------------------------------------------------")
    LORE.lore(name)
else:
    print(f"Tervetuloa takaisin {name}!")

def endGame():
     co2sql = "SELECT co2_budget, co2_consumed FROM game WHERE screen_name = %s"
     moneyfetchsql = "SELECT money FROM game WHERE screen_name = %s"
     cursor.execute(moneyfetchsql, (name,))
     cursor.execute(co2sql, (name,))
     budget = cursor.fetchone()
     if budget[0][1] - budget[0][2] <= 0:
          print("You have run out of co2 budget. Game over.")
     elif budget[0][0] <= 0:
          print("You have run out of money. Game over.")
     print("Game over. Thanks for playing!")
     playerdropsql = "UPDATE game SET screen_name = NULL WHERE screen_name = %s"
     cursor.execute(playerdropsql, (name,))
     print("..GAME OVER..")
     sys.exit()
     
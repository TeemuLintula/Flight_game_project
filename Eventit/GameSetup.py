import mysql.connector

def SetupTietokanta(tietokanta_kayttaja, tietokanta_salasana):
     global yhteys
     #Muuta user ja password takaisin muuttujiksi
     yhteys = mysql.connector.connect(
          host="localhost",
          port = 3306,
          user= tietokanta_kayttaja,
          password= tietokanta_salasana,
          database="flight_game",
          autocommit=True
     )
     print(f"Kirjaudutaan tietokantaan käyttäjällä {tietokanta_kayttaja}")

def Welcome():
     print("Tervetuloa lentopeliin")
     tietokanta_kayttaja = input("Enter MariaDB username: ")
     tietokanta_salasana = input("Enter MariaDB password: ")
     SetupTietokanta(tietokanta_kayttaja, tietokanta_salasana)
     Name = input("Kerro nimesi: ")
     return
#Welcome()
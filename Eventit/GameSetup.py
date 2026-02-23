import mysql.connector
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

# Tarkistetaan onko id-sarake jo AUTO_INCREMENT
cursor.execute("SHOW CREATE TABLE game")
create_stmt = cursor.fetchone()[1]

if "AUTO_INCREMENT" not in create_stmt:
    print("Päivitetään game-taulun id-sarake AUTO_INCREMENT-muotoon...")

    # 1. Poistetaan FK goal_reached-taulusta
    cursor.execute("ALTER TABLE goal_reached DROP FOREIGN KEY goal_reached_ibfk_1")

    # 2. Poistetaan FK-tarkistukset varmuuden vuoksi
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")

    # 3. Muokataan id-sarake oikeaan muotoon
    cursor.execute("""
        ALTER TABLE game
        MODIFY COLUMN id INT NOT NULL AUTO_INCREMENT
    """)

    # 4. Palautetaan FK-tarkistukset
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")

    yhteys.commit()
    print("Taulu päivitetty onnistuneesti!")
else:
    print("Game-taulu on jo oikeassa muodossa.")

# Tarkistaa onko pelaaja tietokannassa, jos ei ole luodaan uusi pelaaja
sql_usernamecheck = "SELECT screen_name FROM game WHERE screen_name = %s"
cursor = yhteys.cursor()
cursor.execute(sql_usernamecheck, (name,))

result = cursor.fetchone()

if not result:
    sql = "INSERT INTO game (screen_name) VALUES (%s)"
    locaddsql = "UPDATE game SET location = 'EFHK', co2_budget = 10000, co2_consumed = 0 WHERE screen_name = %s"
    cursor.execute(sql, (name,))
    cursor.execute(locaddsql, (name,))
    yhteys.commit()
    print(f"Uusi pelaaja {name} luotu tietokantaan")
else:
    print(f"Tervetuloa takaisin {name}!")
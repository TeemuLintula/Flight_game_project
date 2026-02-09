def SetupTietokanta(tietokanta_kauttaja, tietokanta_salasana):
     print("")

def Welcome():
     print("Tervetuloa lentopeliin")
     tietokanta_kauttaja = input("Enter MariaDB username: ")
     tietokanta_salasana = input("Enter MariaDB password: ")
     SetupTietokanta(tietokanta_kauttaja, tietokanta_salasana)
     Name = input("Kerro nimesi: ")

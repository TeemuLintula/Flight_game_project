import random
from enum import Enum
from Eventit import GameSetup
# Enum-luokka, joka määrittelee erilaiset rahtityypit
# Asettaa muuttujien arvot
mission = {
    "Name": "",
    "Legal": True,
    "Location": "",
    "Destination": "",
    "Pay": 0,
    "Cargo": "",
    "Cargo_amount": 0
}
# Generoi tehtävän
def GenerateMission(cursor):
    Legal = random.choice([True, False])
    if Legal:
        Legal_Cargo = ["Humans", "Illegal Humans"]
        Cargo = random.choice(Legal_Cargo)
        cursor.execute(
            "SELECT airport.name, country.name, airport.latitude_deg, airport.longitude_deg, airport.ident FROM airport, country WHERE airport.iso_country = country.iso_country and airport.type != 'heliport' ORDER BY RAND() LIMIT 1;")
        Location = cursor.fetchall()
        cursor.execute(
            "SELECT airport.name, country.name, airport.latitude_deg, airport.longitude_deg, airport.ident FROM airport, country WHERE airport.iso_country = country.iso_country and airport.type != 'heliport' ORDER BY RAND() LIMIT 1;")
        Destination = cursor.fetchall()
        if Cargo == "Humans":
            Cargo_amount = random.randint(5, 100)
            Pay = random.randint(20, 100)
            Name = f"{Location[0][1]} Passenger flight"
        else:
            Cargo_amount = random.randint(20, 100)
            Pay = random.randint(5, 100)
            Name = f"{Location[0][1]} Cargo flight"
    else:
        Illegal_Cargo = ["Illegal Humans", "TAX_FREE_SPICES"]
        Cargo = random.choice(Illegal_Cargo)
        cursor.execute(
            "SELECT airport.name, country.name, airport.latitude_deg, airport.longitude_deg, airport.ident FROM airport, country WHERE airport.iso_country = country.iso_country and airport.type != 'heliport' and (airport.continent = 'AF' or airport.continent = 'SA' or airport.iso_country = 'SY' or airport.iso_country = 'AF') ORDER BY RAND() LIMIT 1;")
        Location = cursor.fetchall()
        cursor.execute(
            "SELECT airport.name, country.name, airport.latitude_deg, airport.longitude_deg, airport.ident FROM airport, country WHERE airport.iso_country = country.iso_country and airport.type != 'heliport' and (airport.continent = 'EU' or airport.continent = 'NA' or airport.iso_country = 'CN' or airport.iso_country = 'IN') ORDER BY RAND() LIMIT 1;")
        Destination = cursor.fetchall()
        if Cargo == "ILLEGAL_HUMANS":
            Cargo_amount = random.randint(5, 100)
            Pay = random.randint(30, 150)
            Name = f"{Location[0][1]} Donkey flight"
        else:
            Cargo_amount = random.randint(20, 100)
            Pay = random.randint(8, 150)
            Name = f"{Location[0][1]} Spice flight"

    mission={
        "Name": Name,
        "Legal": Legal,
        "Location": Location,
        "Destination": Destination,
        "Pay": Pay,
        "Cargo": Cargo,
        "Cargo_amount": Cargo_amount
    }

    return mission
#GenerateMission()

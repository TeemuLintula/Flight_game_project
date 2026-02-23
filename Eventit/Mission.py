import random
from enum import Enum
from Eventit import GameSetup
# Enum-luokka, joka määrittelee erilaiset rahtityypit
class CargoType(Enum):
    HUMANS = "humans"
    ILLEGAL_HUMANS = "illegal humans"
    CARGO = "cargo"
    TAX_FREE_SPICES = "tax free spices"

# Asettaa muuttujien arvot
mission = {
    "Name": "",
    "Legal": True,
    "Location": "",
    "Destination": "",
    "Pay": 0,
    "Cargo": CargoType.CARGO,
    "Cargo_amount": 0
}
# Generoi tehtävän
def GenerateMission():
    Legal = random.choice([True, False])
    if Legal:
        Legal_Cargo = [CargoType.HUMANS, CargoType.CARGO]
        Cargo = random.choice(Legal_Cargo)
        GameSetup.cursor.execute(
            "SELECT airport.name, country.name FROM airport, country WHERE airport.iso_country = country.iso_country and airport.type != 'heliport' ORDER BY RAND() LIMIT 1;")
        Location = GameSetup.cursor.fetchall()
        GameSetup.cursor.execute(
            "SELECT airport.name, country.name FROM airport, country WHERE airport.iso_country = country.iso_country and airport.type != 'heliport' ORDER BY RAND() LIMIT 1;")
        Destination = GameSetup.cursor.fetchall()
        if Cargo == CargoType.HUMANS:
            Cargo_amount = random.randint(5, 100)
            Pay = random.randint(20, 100)
            Name = f"{Location[0][1]} Passenger flight"
        else:
            Cargo_amount = random.randint(20, 100)
            Pay = random.randint(5, 100)
            Name = f"{Location[0][1]} Cargo flight"
    else:
        Illegal_Cargo = [CargoType.ILLEGAL_HUMANS, CargoType.TAX_FREE_SPICES]
        Cargo = random.choice(Illegal_Cargo)
        GameSetup.cursor.execute(
            "SELECT airport.name, country.name FROM airport, country WHERE airport.iso_country = country.iso_country and airport.type != 'heliport' and (airport.continent = 'AF' or airport.continent = 'SA' or airport.iso_country = 'SY' or airport.iso_country = 'AF') ORDER BY RAND() LIMIT 1;")
        Location = GameSetup.cursor.fetchall()
        GameSetup.cursor.execute(
            "SELECT airport.name, country.name FROM airport, country WHERE airport.iso_country = country.iso_country and airport.type != 'heliport' and (airport.continent = 'EU' or airport.continent = 'NA' or airport.iso_country = 'CN' or airport.iso_country = 'IN') ORDER BY RAND() LIMIT 1;")
        Destination = GameSetup.cursor.fetchall()
        if Cargo == CargoType.ILLEGAL_HUMANS:
            Cargo_amount = random.randint(5, 100)
            Pay = random.randint(20, 100)
            Name = f"{Location[0][1]} Donkey flight"
        else:
            Cargo_amount = random.randint(20, 100)
            Pay = random.randint(5, 100)
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

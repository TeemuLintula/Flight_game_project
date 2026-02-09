import random
from enum import Enum

class CargoType(Enum):
    HUMANS = "humans"
    ILLEGAL_HUMANS = "illegal humans"
    CARGO = "cargo"
    TAX_FREE_SPICES = "tax free spices"

mission = {
    "Name": "",
    "Legal": 1,
    "Location": "",
    "Destination": "",
    "Pay": 0,
    "Cargo": CargoType.CARGO,
    "Cargo_amount": 0
}


def GenerateMission():
    Name = "New Mission"
    Legal = random.randint(1,2)
    Location = ""       # Pitää hakea tietokannoista
    Destination = ""
    Pay = 0
    if Legal == 1:
        Pay = random.randint(100,300)
        Legal_Cargo = [CargoType.HUMANS, CargoType.CARGO]
        Cargo = random.choice(Legal_Cargo)
    else:
        Pay = random.randint(250,600)
        Illegal_Cargo = [CargoType.ILLEGAL_HUMANS, CargoType.TAX_FREE_SPICES]
        Cargo = random.choice(Illegal_Cargo)

    if Cargo == CargoType.HUMANS or Cargo == CargoType.ILLEGAL_HUMANS:
        Cargo_amount = random.randint(5,100)
    else:
        Cargo_amount = random.randint(100,1000)

    mission["Name"] = Name
    mission["Legal"] = Legal
    mission["Location"] = Location
    mission["Destination"] = Destination
    mission["Pay"] = Pay
    mission["Cargo"] = Cargo
    mission["Cargo_amount"] = Cargo_amount

    return mission
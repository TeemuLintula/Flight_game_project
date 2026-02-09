import random
from enum import Enum

class CargoType(Enum):
    HUMANS = "humans"
    ILLEGAL_HUMANS = "illegal humans"
    CARGO = "cargo"
    TAX_FREE_SPICES = "tax free spices"

mission = {
    "Name": "",
    "Legal": True,
    "Location": "",
    "Destination": "",
    "Pay": 0,
    "Cargo": CargoType.CARGO,
    "Cargo_amount": 0
}


def GenerateMission():
    Name = "New Mission"
    Legal = random.choice([True, False])
    Location = "work in progress"       # Pitää hakea tietokannoista
    Destination = "work in progress"
    Pay = 0
    if Legal:
        Pay = random.randint(1000,3000)
        Legal_Cargo = [CargoType.HUMANS, CargoType.CARGO]
        Cargo = random.choice(Legal_Cargo)
    else:
        Pay = random.randint(2500,6000)
        Illegal_Cargo = [CargoType.ILLEGAL_HUMANS, CargoType.TAX_FREE_SPICES]
        Cargo = random.choice(Illegal_Cargo)

    if Cargo == CargoType.HUMANS or Cargo == CargoType.ILLEGAL_HUMANS:
        Cargo_amount = random.randint(5,100)
    else:
        Cargo_amount = random.randint(100,1000)

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
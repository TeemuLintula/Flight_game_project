from ctypes.wintypes import BOOL
from enum import Enum

class CargoType(Enum):
    HUMANS = "humans"
    ILLEGAL_HUMANS = "illegal humans"
    CARGO = "cargo"
    TAX_FREE_SPICES = "tax free spices"

mission = {
    "Name": str,
    "Legal": BOOL,
    "Location": str,
    "Destination": str,
    "Pay": int,
    "Cargotype": CargoType,
    "Cargo_amount": float
}


def GenerateMission():
    mission
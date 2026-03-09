import random
import time
import geopy
from geopy.distance import Distance

from Eventit import GameSetup
from Eventit import Mission
from Eventit import HomeBase

def calculateDistance(location, destination):
    distance = Distance(location)
def newMission():
    print("-----------------------------------------------------------------------------------------------")
    print("Your new mission is: ", Current_mission["Name"])
    print("Legal status: ", str(Current_mission["Legal"]))
    print(f"Location: {Current_mission['Location'][0][0]}, {Current_mission['Location'][0][1]}")
    print(f"Destination: {Current_mission['Destination'][0][0]}, {Current_mission['Destination'][0][1]}")
    print(Current_mission["Cargo"])
    if Current_mission["Cargo"] == Mission.CargoType.HUMANS or Current_mission[
        "Cargo"] == Mission.CargoType.ILLEGAL_HUMANS:
        print("Amount of passengers: ", str(Current_mission["Cargo_amount"]))
        print("Job will pay you: ", Current_mission["Pay"], "Euros/Passenger")
    else:
        if Current_mission["Cargo"] == Mission.CargoType.CARGO:
            print("Cargo amount: ", str(Current_mission["Cargo_amount"] * 1000) + "KG")
            print("Job will pay you: ", Current_mission["Pay"], "Euros/Tonne")
        else:
            print("Cargo amount: ", str(Current_mission["Cargo_amount"]) + "KG")
            print("Job will pay you: ", Current_mission["Pay"], "Euros/Kilo")

def missionFLight():
    print("-----------------------------------------------------------------------------------------------")
    print(f"You are flying to {Current_mission['Location'][0][0]}")
    for i in range(0, 5):
        print(".")
        time.sleep(1)
        #Tässä kutsuu arvonnan
    print(f"You arrived to {Current_mission['Location'][0][0]}")
    if Current_mission["Cargo"] == Mission.CargoType.HUMANS or Current_mission["Cargo"] == Mission.CargoType.ILLEGAL_HUMANS:
        print("Taking in passengers")
    else:
        print("Loading cargo")
    for i in range(0, 5):
        print(".")
        time.sleep(1)
        #lentokenttä eventit tähän
    print(f"You are flying to {Current_mission['Destination'][0][0]}")
    for i in range(0, 5):
        print(".")
        time.sleep(1)
    print(f"You arrived to final destination {Current_mission['Destination'][0][0]}")


while True:
    vastaus = 1
    missions = []
    print("You are now at...") #Tähän pelaajan nykyinen sijainti
    vastaus = int(input("1. Select new mission / 2. Fly to homebase: "))
    if vastaus == 1:
        while True:
            print("-----------------------------------------------------------------------------------------------")
            if vastaus == 1:
                for i in range(random.randint(3, 6)):
                    missions.append(Mission.GenerateMission())
                    print(missions[i]["Name"], i)
            else:
                for i in range(len(missions)):
                    print(missions[i]["Name"], i)
            Current_mission = missions[int(input("Select mission number:"))]
            newMission()
            vastaus = int(input("1. Start mision 2. Change mission: "))
            if vastaus == 1:
                missionFLight()
                break
    else:
        id_game = "SELECT id FROM game WHERE screen_name = %s"
        GameSetup.cursor.execute(id_game, (GameSetup.name,))
        id_game = GameSetup.cursor.fetchone()[0]
        ownedbasessql = """SELECT name
                        FROM home_base hb
                        JOIN game_home_base ghb
                        ON hb.ident = ghb.base_ident
                        WHERE ghb.game_id = %s"""
        GameSetup.cursor.execute(ownedbasessql, (id_game,))
        homebases = [base[0] for base in GameSetup.cursor.fetchall()] #tähän laitetaan pelaajan omistamat baset
        for base in range(len(homebases)):
            print(f"{homebases[base]} {base}")
        selectedBase = homebases[int(input("Select base number: "))]
        print("-----------------------------------------------------------------------------------------------")
        print(f"You are flying to {selectedBase}")
        for i in range(0, 5):
            print(".")
            time.sleep(1)
        print(f"You arrived to {selectedBase}")
        HomeBase.homeBase(GameSetup, selectedBase)

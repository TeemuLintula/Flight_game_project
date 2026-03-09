import random
import time
from geopy.distance import geodesic

from Eventit import GameSetup
from Eventit import Mission
from Eventit import HomeBase

def calculateDistance(location, destination):
    distance = geodesic((location[2], location[3]), (destination[2], destination[3])).kilometers

    GameSetup.cursor.execute(f"select airplane.moottori from airplane, game where airplane.game_id = game.id and game.screen_name = '{GameSetup.name}'")
    motor = GameSetup.cursor.fetchall()
    consumption = 5 / motor[0][0]

    co = int(distance / 25 * consumption)
    print(f"Distance flought {int(distance)}km and co2 consumed {co}")
    cosql = f"UPDATE game SET co2_consumed = co2_consumed + {co} WHERE screen_name = %s"
    GameSetup.cursor.execute(cosql, (GameSetup.name,))
    return co

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
        # During flight tähän
    print(f"You arrived to {Current_mission['Location'][0][0]}")
    co = 0
    co += calculateDistance(currentLocation, Current_mission["Location"][0])

    #kuljetettavan tavaran määrän laskeminen
    GameSetup.cursor.execute(f"select airplane.ruuma, airplane.istuinpaikat from airplane, game where airplane.game_id = game.id and game.screen_name = '{GameSetup.name}'")
    allparts = GameSetup.cursor.fetchall()
    storageLimit = allparts[0][0] * 20
    seats = allparts[0][1] * 20
    cargoAmount = 0

    if Current_mission["Cargo"] == Mission.CargoType.HUMANS or Current_mission["Cargo"] == Mission.CargoType.ILLEGAL_HUMANS:
        print("Taking in passengers")
        cargoAmount = Current_mission["Cargo_amount"]
        if cargoAmount > seats:
            cargoAmount = seats
    else:
        print("Loading cargo")
        cargoAmount = Current_mission["Cargo_amount"]
        if cargoAmount > storageLimit:
            cargoAmount = storageLimit
    for i in range(0, 5):
        print(".")
        time.sleep(1)
        #lentokenttä eventit tähän

    if Current_mission["Cargo"] == Mission.CargoType.CARGO:
        print(f"{cargoAmount * 1000}kg of cargo loaded in")
    elif Current_mission["Cargo"] == Mission.CargoType.TAX_FREE_SPICES:
        print(f"{cargoAmount}kg of tax free spices loaded in")
    else:
        print(f"{cargoAmount} passengers taken in")
    print("Getting ready to fly to the next destination")
    for i in range(0, 5):
        print(".")
        time.sleep(1)


    print(f"You are flying to {Current_mission['Destination'][0][0]}")
    for i in range(0, 5):
        print(".")
        time.sleep(1)
        # During flight tähän


    print(f"You arrived to final destination {Current_mission['Destination'][0][0]}")
    co += calculateDistance(Current_mission["Location"][0], Current_mission["Destination"][0])
    GameSetup.cursor.execute(f"UPDATE game SET location = '{Current_mission["Destination"][0][4]}' where screen_name = '{GameSetup.name}'")
    pay = Current_mission["Pay"] * cargoAmount - co
    GameSetup.cursor.execute(f"UPDATE game SET money = money + {pay} where game.screen_name = '{GameSetup.name}'")
    print(f"This mission paid you {pay + co}E - {co}E for gasoline total of {pay}Euros: ")

while True:
    print("-----------------------------------------------------------------------------------------------")
    vastaus = 1
    missions = []
    GameSetup.cursor.execute(f"select airport.name, country.name, airport.latitude_deg, airport.longitude_deg from airport, country, game where screen_name = '{GameSetup.name}' and game.location = airport.ident and airport.iso_country = country.iso_country")
    currentLocation = GameSetup.cursor.fetchone()
    GameSetup.cursor.execute(f"select game.money, game.co2_budget, game.co2_consumed from game where game.screen_name = '{GameSetup.name}'")
    budget = GameSetup.cursor.fetchall()
    print(f"You are now at {currentLocation[0]} {currentLocation[1]}") #Tähän pelaajan nykyinen sijainti
    print(f"Current balance: {budget[0][0]} Euros and {budget[0][1] - budget[0][2]} co2")
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
        ownedbasessql = """SELECT name, id, latitude_deg, longitude_deg
                        FROM home_base hb
                        JOIN game_home_base ghb
                        ON hb.ident = ghb.base_ident
                        WHERE ghb.game_id = %s"""
        GameSetup.cursor.execute(ownedbasessql, (id_game,))
        homebases = [base for base in GameSetup.cursor.fetchall()] #tähän laitetaan pelaajan omistamat baset
        for base in range(len(homebases)):
            print(f"{homebases[base][0]} {base}")
        selectedBase = homebases[int(input("Select base number: "))]
        print("-----------------------------------------------------------------------------------------------")
        print(f"You are flying to {selectedBase[0]}")
        for i in range(0, 5):
            print(".")
            time.sleep(1)
        print(f"You arrived to {selectedBase[0]}")
        co = calculateDistance(currentLocation, selectedBase)
        GameSetup.cursor.execute(f"UPDATE game SET money = money - {co} where game.screen_name = '{GameSetup.name}'")
        print(f"You paid {co}Euros for gasoline ")
        GameSetup.cursor.execute(f"SELECT home_base.ident from home_base where home_base.name = '{selectedBase[0]}'")
        baseident = GameSetup.cursor.fetchone()
        #GameSetup.cursor.execute(f"UPDATE game SET location = '{Current_mission["Destination"][0][4]}' where screen_name = '{GameSetup.name}'")
        GameSetup.cursor.execute(f"UPDATE game SET location = '{baseident[0]}' where screen_name = '{GameSetup.name}'")
        #Homebase eventti (toisen vois vaikka laittaa sinne kun käy nukkumassa)
        HomeBase.homeBase(GameSetup, selectedBase)

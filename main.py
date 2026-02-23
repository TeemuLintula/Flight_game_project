import random

from Eventit import GameSetup
from Eventit import Mission

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
        print("Cargo amount: ", str(Current_mission["Cargo_amount"] * 1000) + "KG")
        print("Job will pay you: ", Current_mission["Pay"], "Euros/Tonne")

while True:
    vastaus = 1
    missions = []
    while True:
        print("-----------------------------------------------------------------------------------------------")
        if vastaus == 1:
            for i in range(random.randint(3, 6)):
                missions.append(Mission.GenerateMission())
                print(missions[i]["Name"], i)
        else:
            for mission in missions:
                print(missions[mission]["Name"], missions)
        Current_mission = missions[int(input("Select mission number:"))]
        newMission()
        vastaus = int(input("1. Start mision 2. Change mission: "))
        if vastaus == 1:
            break
    if input("Do you want to continue (y/n): ") == "n":
        break


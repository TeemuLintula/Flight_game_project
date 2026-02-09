from Eventit import GameSetup
from Eventit import Mission

#GameSetup.Welcome()
Current_mission = dict
Current_mission = Mission.GenerateMission()


print("-----------------------------------------------------------------------------------------------")
print("Your new mission is: ", Current_mission["Name"])
print("Legal status: ", str(Current_mission["Legal"]))
print("Location: ", Current_mission["Location"])
print("Destination: ", Current_mission["Destination"])
print("Job will pay you: ", Current_mission["Pay"], "Euros")
print(Current_mission["Cargo"])
if Current_mission["Cargo"] == Mission.CargoType.HUMANS or Current_mission["Cargo"] == Mission.CargoType.ILLEGAL_HUMANS:
    print("Amount of passengers: ", str(Current_mission["Cargo_amount"]))
else:
    print("Cargo amount: ", str(Current_mission["Cargo_amount"]) + "KG")

import random
import time
import math
from Eventit.random_eventit import homebase_eventit
def homeBase(GameSetup, selectedBase):
    # home_base valikko, jossa voit tehdä basessa eri asioita
    Homebase_eventit.randomevent_h()
    while True:
        vastaus = int(input("1. Exit base 2. Sleep 3. Open PC 4. Check plantations: "))
        if vastaus == 1:
            break
        elif vastaus == 2:
            print(f"You slept for {random.randint(6, 12)} hours")
            for i in range(0, 5):
                print(".")
                time.sleep(1)
            randomevent_h()
            print("You feel refreshed and ready to fly!")
        elif vastaus == 4:
            plantschecksql = "SELECT plants FROM home_base WHERE name = %s"
            GameSetup.cursor.execute(plantschecksql, (selectedBase[0],))
            plants = GameSetup.cursor.fetchone()
            print(f"You have {plants[0]} plants in this base")

            #Tähän logiikka
            #moneyaddsql = "UPDATE game SET money = money + %s WHERE screen_name = %s"
            #GameSetup.cursor.execute(moneyaddsql, (50 * plants, GameSetup.name,))
            #plantssellsql = "UPDATE home_base SET plants = 0 WHERE name = %s"
            #GameSetup.cursor.execute(plantssellsql, (selectedBase[0],))
            #print(f"You sold {plants} plants from this base for {50 * plants} euros")
        elif vastaus == 3:
            while True:
                print("-----------------------------------------------------------------------------------------------")
                vastaus = int(input("1. Upgrade airplane 2. Buy new properties 3. Exit: "))
                if vastaus == 1:
                    GameSetup.cursor.execute(f"select airplane.ruuma, airplane.moottori, airplane.istuinpaikat from airplane, game where airplane.game_id = game.id and game.screen_name = '{GameSetup.name}'")
                    allparts = GameSetup.cursor.fetchall()
                    GameSetup.cursor.execute(f"select game.money from game where game.screen_name = '{GameSetup.name}'")
                    money = GameSetup.cursor.fetchall()
                    money = money[0][0]
                    storageLimit = allparts[0][0] * 20
                    fuelUsage = 5 / allparts[0][1]
                    seats = allparts[0][2] * 20
                    storagePrice = allparts[0][0] * 500
                    enginePrice = allparts[0][1] * 500
                    seatprice = allparts[0][2] * 500
                    print("-----------------------------------------------------------------------------------------------")
                    print(f"Current balance: {money} Euros")
                    print(f"Cargo level: {allparts[0][0]} (Storage capacity: {storageLimit * 1000}kg) \n" 
                          f"Motor level: {allparts[0][1]} (Uses {fuelUsage:.1f} units of fuel per kilometer) \n"
                          f"Seats level: {allparts[0][2]} (Number of seats: {seats})")
                    if allparts[0][0] <= 5:
                        print(f"1. Upgrade Cargo -> {(allparts[0][0] + 1) * 20 * 1000}kg capacity for: {storagePrice} euros")
                    if allparts[0][1] <= 5:
                        print(f"2. Upgrade Engine -> {5 / (allparts[0][1] + 1):.1f} Units of fuel per kilometer for: {enginePrice} euros")
                    if allparts[0][2] <= 5:
                        print(f"3. Upgrade Seats -> {(allparts[0][2] + 1) * 20} seats for: {seatprice} euros")
                    vastaus = int(input("1. Upgrade Cargo 2. Upgrade Engine 3. Upgrade Seats 4. Exit: "))
                    if vastaus == 1:
                        if money >= storagePrice:
                            money -= storagePrice
                            GameSetup.cursor.execute(f"UPDATE airplane, game SET ruuma = ruuma + 1 where airplane.game_id = game.id and game.screen_name = '{GameSetup.name}'")
                            GameSetup.cursor.execute(f"UPDATE game SET money = {money} where game.screen_name = '{GameSetup.name}'")
                            print("installing new parts")
                            for i in range(0, 5):
                                print(".")
                            time.sleep(1)
                            print(f"Install succesfull you have now {(allparts[0][0] + 1) * 20 * 1000}kg storage capacity")
                        else:
                            print("Insufficient funds")
                    if vastaus == 2:
                        if money >= enginePrice:
                            money -= enginePrice
                            GameSetup.cursor.execute(f"UPDATE airplane, game SET moottori = moottori + 1 where airplane.game_id = game.id and game.screen_name = '{GameSetup.name}'")
                            GameSetup.cursor.execute(f"UPDATE game SET money = {money} where game.screen_name = '{GameSetup.name}'")
                            print("installing new parts")
                            for i in range(0, 5):
                                print(".")
                            time.sleep(1)
                            print(f"Install succesfull you are using now {5 / (allparts[0][1] + 1):.1f} Units of fuel per kilometer")
                        else:
                            print("Insufficient funds")
                    if vastaus == 3:
                        if money >= seatprice:
                            money -= seatprice
                            GameSetup.cursor.execute(f"UPDATE airplane, game SET istuinpaikat = istuinpaikat + 1 where airplane.game_id = game.id and game.screen_name = '{GameSetup.name}'")
                            GameSetup.cursor.execute(f"UPDATE game SET money = {money} where game.screen_name = '{GameSetup.name}'")
                            print("installing new parts")
                            for i in range(0, 5):
                                print(".")
                            time.sleep(1)
                            print(f"Install succesfull you have now {(allparts[0][2]) * 20} Seats in your plane")
                        else:
                            print("Insufficient funds")
                elif vastaus == 2:
                    break
                elif vastaus == 3:
                    break
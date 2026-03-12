import random
import time
from Eventit.random_eventit import Homebase_eventit
from Eventit import LORE
def homeBase(GameSetup, selectedBase):
    if selectedBase[0] == "Island of the big E":
        LORE.lore_ending(GameSetup.name)
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
            Homebase_eventit.randomevent_h()
            print("You feel refreshed and ready to fly!")
        elif vastaus == 4:
            plantschecksql = "SELECT plants FROM home_base WHERE name = %s"
            GameSetup.cursor.execute(plantschecksql, (selectedBase[0],))
            plants = GameSetup.cursor.fetchone()
            print(f"You have {plants[0]} plants in this base")
            sellplants = input("Press enter to sell all plants: ")
            if sellplants == "":
                sellprice = plants[0] * 50
                GameSetup.cursor.execute(f"UPDATE game SET money = money + {sellprice} WHERE screen_name = '{GameSetup.name}'")
                GameSetup.cursor.execute(f"UPDATE home_base SET plants = 0 WHERE name = '{selectedBase[0]}'")
                print(f"You sold {plants[0]} plants from this base for {sellprice} euros")
        elif vastaus == 3:
            while True:
                GameSetup.cursor.execute(f"select game.money from game where game.screen_name = '{GameSetup.name}'")
                money = GameSetup.cursor.fetchall()
                money = money[0][0]

                print("-----------------------------------------------------------------------------------------------")
                vastaus = int(input("1. Upgrade airplane 2. Buy new properties 3. Exit: "))
                if vastaus == 1:
                    GameSetup.cursor.execute(f"select airplane.ruuma, airplane.moottori, airplane.istuinpaikat from airplane, game where airplane.game_id = game.id and game.screen_name = '{GameSetup.name}'")
                    allparts = GameSetup.cursor.fetchall()
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
                    if allparts[0][0] < 5:
                        print(f"1. Upgrade Cargo -> {(allparts[0][0] + 1) * 20 * 1000}kg capacity for: {storagePrice} euros")
                    if allparts[0][1] < 5:
                        print(f"2. Upgrade Engine -> {5 / (allparts[0][1] + 1):.1f} Units of fuel per kilometer for: {enginePrice} euros")
                    if allparts[0][2] < 5:
                        print(f"3. Upgrade Seats -> {(allparts[0][2] + 1) * 20} seats for: {seatprice} euros")
                    vastaus = int(input("1. Upgrade Cargo 2. Upgrade Engine 3. Upgrade Seats 4. Exit: "))
                    if vastaus == 1:
                        if allparts[0][0] == 5:
                            print("No new cargo uprgrades avaiable")
                            break
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
                        if allparts[0][1] == 5:
                            print("No new engine uprgrades avaiable")
                            break
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
                        if allparts[0][2] == 5:
                            print("No new seat uprgrades avaiable")
                            break
                        if money >= seatprice:
                            money -= seatprice
                            GameSetup.cursor.execute(f"UPDATE airplane, game SET istuinpaikat = istuinpaikat + 1 where airplane.game_id = game.id and game.screen_name = '{GameSetup.name}'")
                            GameSetup.cursor.execute(f"UPDATE game SET money = {money} where game.screen_name = '{GameSetup.name}'")
                            print("installing new parts")
                            for i in range(0, 5):
                                print(".")
                            time.sleep(1)
                            print(f"Install succesfull you have now {(allparts[0][2] + 1) * 20} Seats in your plane")
                        else:
                            print("Insufficient funds")
                elif vastaus == 2:
                    id_game = "SELECT id FROM game WHERE screen_name = %s"
                    GameSetup.cursor.execute(id_game, (GameSetup.name,))
                    id_game = GameSetup.cursor.fetchone()[0]
                    GameSetup.cursor.execute(f"SELECT home_base.name, home_base.price, home_base.continent, home_base.ident from home_base where ident NOT IN (select game_home_base.base_ident from game_home_base where game_id = {id_game})")
                    basesNotOwned = [base for base in GameSetup.cursor.fetchall()]
                    print("-----------------------------------------------------------------------------------------------")
                    print(f"Current balance: {money} Euros")
                    if len(basesNotOwned) == 0:
                        print("There is no new properties to buy")
                    else:
                        print("Properies for sale: ")
                        for base in range(len(basesNotOwned)):
                            print(f"{base}. {basesNotOwned[base][0]}/{basesNotOwned[base][2]}// {basesNotOwned[base][1]}Euros")
                        vastaus = input("Select base number or press e to exit: ")
                        if vastaus == "e":
                            break
                        else:
                            if int(vastaus) in range(0, len(basesNotOwned)):
                                selectedBase = basesNotOwned[int(vastaus)]
                                if money >= selectedBase[1]:
                                    money -= selectedBase[1]
                                    GameSetup.cursor.execute(f"UPDATE game SET money = {money} where game.screen_name = '{GameSetup.name}'")
                                    GameSetup.cursor.execute(f"INSERT INTO game_home_base (game_id, base_ident) VALUES ({id_game},'{selectedBase[3]}')")

                                    print("-----------------------------------------------------------------------------------------------")
                                    print(f"You acquired a new base: {selectedBase[0]}/{selectedBase[2]} for {selectedBase[1]}Euros")
                                    break
                                else:
                                    print("insufficient funds")
                                    break
                else:
                    break
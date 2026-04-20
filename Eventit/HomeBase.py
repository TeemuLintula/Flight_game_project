import random
import time
from Eventit.random_eventit import Homebase_eventit
from Eventit import LORE


def homeBase(GameSetup, selectedBase):
    if selectedBase[0] == "Island of the big Z":
        LORE.lore_ending(GameSetup.name)
    Homebase_eventit.randomevent_h()
    while True:
        vastaus = int(input("1. Exit base 2. Sleep 3. Open PC 4. Check plantations: "))
        if vastaus == 1:
            break
        elif vastaus == 2:
            _sleep()
        elif vastaus == 3:
            _open_pc(GameSetup)
        elif vastaus == 4:
            _check_plantations(GameSetup, selectedBase)


def _sleep():
    print(f"You slept for {random.randint(6, 12)} hours")
    for i in range(0, 5):
        print(".")
        time.sleep(1)
    Homebase_eventit.skinwalker()
    print("You feel refreshed and ready to fly!")


def _check_plantations(GameSetup, selectedBase):
    plantschecksql = "SELECT plants FROM home_base WHERE name = %s"
    GameSetup.cursor.execute(plantschecksql, (selectedBase[0],))
    plants = GameSetup.cursor.fetchone()
    print(f"You have {plants[0]} plants in this base")
    sellplantsm = input("1. Sell all plants 2. buy more plants 3 Exit platation menu: ")
    if sellplantsm == "1":
        sellprice = plants[0] * 15
        GameSetup.cursor.execute(f"UPDATE game SET money = money + {sellprice} WHERE screen_name = '{GameSetup.name}'")
        GameSetup.cursor.execute(f"UPDATE home_base SET plants = 0 WHERE name = '{selectedBase[0]}'")
        print(f"You sold {plants[0]} plants from this base for {sellprice} euros")
    elif sellplantsm == "2":
        buyplants = int(input("How many plants do you want to buy? 15€ per plant: "))
        buyprice = buyplants * 15
        GameSetup.cursor.execute(f"SELECT money FROM game WHERE screen_name = '{GameSetup.name}'")
        money = GameSetup.cursor.fetchone()[0]
        if money >= buyprice:
            GameSetup.cursor.execute(f"UPDATE game SET money = money - {buyprice} WHERE screen_name = '{GameSetup.name}'")
            GameSetup.cursor.execute(f"UPDATE home_base SET plants = plants + {buyplants} WHERE name = '{selectedBase[0]}'")
            print(f"You bought {buyplants} plants for {buyprice} euros")
        else:
            print("You don't have enough money.")
    else:
        print("Exiting plantation menu")


def _open_pc(GameSetup):
    while True:
        GameSetup.cursor.execute(f"select game.money from game where game.screen_name = '{GameSetup.name}'")
        money = GameSetup.cursor.fetchall()[0][0]
        print("-----------------------------------------------------------------------------------------------")
        vastaus = int(input("1. Upgrade airplane 2. Buy new properties 3. Exit: "))
        if vastaus == 1:
            if _upgrade_airplane(GameSetup, money):
                break
        elif vastaus == 2:
            if _buy_properties(GameSetup, money):
                break
        else:
            break


def _upgrade_airplane(GameSetup, money):
    """Returns True if the PC menu should close."""
    GameSetup.cursor.execute(f"select airplane.ruuma, airplane.moottori, airplane.istuinpaikat from airplane, game where airplane.game_id = game.id and game.screen_name = '{GameSetup.name}'")
    allparts = GameSetup.cursor.fetchall()
    cargo_level, engine_level, seats_level = allparts[0]
    storagePrice = cargo_level * 500
    enginePrice = engine_level * 500
    seatprice = seats_level * 500

    print("-----------------------------------------------------------------------------------------------")
    print(f"Current balance: {money} Euros")
    print(f"Cargo level: {cargo_level} (Storage capacity: {cargo_level * 20 * 1000}kg) \n"
          f"Motor level: {engine_level} (Uses {5 / engine_level:.1f} units of fuel per kilometer) \n"
          f"Seats level: {seats_level} (Number of seats: {seats_level * 20})")
    if cargo_level < 5:
        print(f"1. Upgrade Cargo -> {(cargo_level + 1) * 20 * 1000}kg capacity for: {storagePrice} euros")
    if engine_level < 5:
        print(f"2. Upgrade Engine -> {5 / (engine_level + 1):.1f} Units of fuel per kilometer for: {enginePrice} euros")
    if seats_level < 5:
        print(f"3. Upgrade Seats -> {(seats_level + 1) * 20} seats for: {seatprice} euros")

    vastaus = int(input("1. Upgrade Cargo 2. Upgrade Engine 3. Upgrade Seats 4. Exit: "))

    upgrades = {
        1: ("ruuma", cargo_level, storagePrice,
            f"Install successful you have now {(cargo_level + 1) * 20 * 1000}kg storage capacity",
            "No new cargo upgrades available"),
        2: ("moottori", engine_level, enginePrice,
            f"Install successful you are using now {5 / (engine_level + 1):.1f} Units of fuel per kilometer",
            "No new engine upgrades available"),
        3: ("istuinpaikat", seats_level, seatprice,
            f"Install successful you have now {(seats_level + 1) * 20} Seats in your plane",
            "No new seat upgrades available"),
    }

    if vastaus not in upgrades:
        return False

    column, level, price, success_msg, maxed_msg = upgrades[vastaus]

    if level == 5:
        print(maxed_msg)
        return True

    if money >= price:
        money -= price
        GameSetup.cursor.execute(f"UPDATE airplane, game SET {column} = {column} + 1 where airplane.game_id = game.id and game.screen_name = '{GameSetup.name}'")
        GameSetup.cursor.execute(f"UPDATE game SET money = {money} where game.screen_name = '{GameSetup.name}'")
        print("installing new parts")
        for i in range(0, 5):
            print(".")
        time.sleep(1)
        print(success_msg)
    else:
        print("Insufficient funds")
    return False


def _buy_properties(GameSetup, money):
    """Returns True if the PC menu should close."""
    id_game = "SELECT id FROM game WHERE screen_name = %s"
    GameSetup.cursor.execute(id_game, (GameSetup.name,))
    id_game = GameSetup.cursor.fetchone()[0]
    GameSetup.cursor.execute(f"SELECT home_base.name, home_base.price, home_base.continent, home_base.ident from home_base where ident NOT IN (select game_home_base.base_ident from game_home_base where game_id = {id_game})")
    basesNotOwned = [base for base in GameSetup.cursor.fetchall()]
    print("-----------------------------------------------------------------------------------------------")
    print(f"Current balance: {money} Euros")
    if len(basesNotOwned) == 0:
        print("There is no new properties to buy")
        return False
    print("Properies for sale: ")
    for base in range(len(basesNotOwned)):
        print(f"{base}. {basesNotOwned[base][0]}/{basesNotOwned[base][2]}// {basesNotOwned[base][1]}Euros")
    vastaus = input("Select base number or press e to exit: ")
    if vastaus == "e":
        return True
    if int(vastaus) not in range(0, len(basesNotOwned)):
        return False
    selectedBase = basesNotOwned[int(vastaus)]
    if money >= selectedBase[1]:
        money -= selectedBase[1]
        GameSetup.cursor.execute(f"UPDATE game SET money = {money} where game.screen_name = '{GameSetup.name}'")
        GameSetup.cursor.execute(f"INSERT INTO game_home_base (game_id, base_ident) VALUES ({id_game},'{selectedBase[3]}')")
        print("-----------------------------------------------------------------------------------------------")
        print(f"You acquired a new base: {selectedBase[0]}/{selectedBase[2]} for {selectedBase[1]}Euros")
    else:
        print("insufficient funds")
    return True
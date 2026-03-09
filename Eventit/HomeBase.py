import random
import time
def homeBase(GameSetup, selectedBase):
    # arpoo homebase eventin
    # home_base valikko, jossa voit tehdä basessa eri asioita
    while True:
        plantschecksql = "SELECT plants FROM home_base WHERE name = %s"
        GameSetup.cursor.execute(plantschecksql, (selectedBase,))
        plants = GameSetup.cursor.fetchone()[0]
        print(f"You have {plants} plants in this base")
        vastaus = int(
            input("1. Exit base 2. Sleep 3. Sell plants from this base for 50 euros/plant: "))
        if vastaus == 1:
            break
        elif vastaus == 2:
            print(f"You slept for {random.randint(6, 12)} hours")
            for i in range(0, 5):
                print(".")
            time.sleep(1)
            print("You feel refreshed and ready to fly!")
        elif vastaus == 3:
            moneyaddsql = "UPDATE game SET money = money + %s WHERE screen_name = %s"
            GameSetup.cursor.execute(moneyaddsql, (50 * plants, GameSetup.name,))
            plantssellsql = "UPDATE home_base SET plants = 0 WHERE name = %s"
            GameSetup.cursor.execute(plantssellsql, (selectedBase,))
            print(f"You sold {plants} plants from this base for {50 * plants} euros")
        elif vastaus == 4:
            break # ostaa uusia osia
import sys
import time
import random

def hidastulostus(teksti, nopeus=0.03):
    for c in teksti + "\n":
        sys.stdout.write(c)
        sys.stdout.flush()
        time.sleep(nopeus)

def tulli():

    hidastulostus("Customs are asking you to verify cargo")

    while True:
        vastaus = input("Are you willing to show cargo? (yes/no) ")
        if vastaus.upper() == "YES":
            hidastulostus('Customs: ("checking")')
            hidastulostus("You're good to go!")
            break
        elif vastaus.upper() == "NO":
            hidastulostus("Customs: We will let this slide for just this time...")
            break
        else:
            print("Please enter yes or no")

def nainen():
    hidastulostus("Your wife said before you left, that you had better to bring me some presents.")

    hidastulostus("Are you going to")
    hidastulostus("(1) A shoe store")
    hidastulostus("(2) A Candy shop")
    hidastulostus("(3) Ignore your wife")
    hidastulostus("(4) A Perfume store")

    while True:
        valinta = input("Choose between (1-4): ")
        if valinta in ["1", "2", "3", "4"]:
            break
        else:
            hidastulostus("Invalid selection, please try again!")
    if valinta == "1":
        hidastulostus("You bought yor wife a pair of shoes. She liked it.")
    elif valinta == "2":
        hidastulostus("you bought your wife a moomin candy box. She felt nostalgic.")
    elif valinta == "3":
        hidastulostus("You wife got tired of your bullcrap. She left you.")
    elif valinta == "4":
        hidastulostus("Your just a man you dont know anything about perfumes.")
        hidastulostus("Your wife hates the perfume but appreciated the thought.")

tapahtumat = [nainen, tulli,]

def randomrandomiser():
    tapahtuma = random.choice(tapahtumat)
    tapahtuma()

def randomevent_a(GameSetup):
    luku = random.randint(1,50)
    GameSetup.cursor.execute(f"select game.co2_budget, game.co2_consumed from game where game.screen_name = '{GameSetup.name}'")
    budget = GameSetup.cursor.fetchall()
    budget = budget[0][0] - budget[0][1]
    if budget < 0:
        if luku <= 5:
            #Tähän se otettiin kiinni jne
    elif luku == 1:
        randomrandomiser()

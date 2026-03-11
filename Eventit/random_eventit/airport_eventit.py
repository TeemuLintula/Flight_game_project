import sys
import time
import random

def hidastulostus(teksti, nopeus=0.03):
    for c in teksti + "\n":
        sys.stdout.write(c)
        sys.stdout.flush()
        time.sleep(nopeus)

def tulli():

    print("Customs are asking you to verify cargo")

    while True:
        vastaus = input("Are you willing to show cargo? (yes/no) ")
        if vastaus.upper() == "YES":
            print('Customs: ("checking")')
            print("You're good to go! ")
            break
        elif vastaus.upper() == "NO":
            print("Customs: We're going to get you to prison")
            #pelin lopetus funktio
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

def randomevent():
    tapahtuma = random.choice(tapahtumat)
    tapahtuma()
randomevent()
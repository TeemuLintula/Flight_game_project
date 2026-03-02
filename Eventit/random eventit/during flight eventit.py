import sys
import time

def hidastulostus(teksti, nopeus=0.03):
    for c in teksti + "\n":
        sys.stdout.write(c)
        sys.stdout.flush()
        time.sleep(nopeus)

def stuertti():
    hidastulostus("Stuertti tulee kysymään ruokaa!")
    hidastulostus("Valitse mitä syöt:")
    hidastulostus("1 - Pizza")
    hidastulostus("2 - Hampurilainen")
    hidastulostus("3 - Salaatti")
    hidastulostus("4 - Pasta")
    hidastulostus("5 - en syö")

    # 🔁 kysytään kunnes valinta on oikein
    while True:
        valinta = input("Anna numero (1-5): ")

        if valinta in ["1", "2", "3", "4", "5"]:
            break
        else:
            hidastulostus("Virheellinen valinta, yritä uudestaan!")

    # ✅ oikea valinta käsitellään
    if valinta == "1":
        hidastulostus("Valitsit pizzan 🍕")
    elif valinta == "2":
        hidastulostus("Valitsit hampurilaisen 🍔")
    elif valinta == "3":
        hidastulostus("Valitsit salaatin 🥗")
    elif valinta == "4":
        hidastulostus("Valitsit pastan 🍝")
    elif valinta == "5":
        hidastulostus("Vieruskaverisi ajattelee sinua köyhäksi 😅")


import sys
import time
import random

def hidastulostus(teksti, nopeus=0.03):
    for c in teksti + "\n":
        sys.stdout.write(c)
        sys.stdout.flush()
        time.sleep(nopeus)

def terrorist():
    hidastulostus("Bad men are trying to kidnap the plane!")

    while True:
        vastaus = input(
            "Are you going to (1) be a hero or (2) look away and pray? Enter 1 or 2: "
        )

        # be a hero 50/50 kuoleman mahis
        if vastaus == "1":
            luku = random.randint(1, 10)

            if luku <= 5:
                hidastulostus("Your attempt to fight the bad men failed.")
                luku2 = random.randint(1, 4)

                if luku2 == 1:
                    hidastulostus("The bad men flew the plane into a building. You died.")
                    # tähän pelin lopetus funktio!
                else:
                    hidastulostus("The bad men kidnapped you and you rotted in a cell for 1 year.")
                break
            else:
                hidastulostus("You punched the bad men while they weren’t looking.")
                hidastulostus("You successfully prevented the kidnapping!")
                break

        # lookaway and pray 20/80 kuoleman mahdollisuus
        elif vastaus == "2":
            luku2 = random.randint(1, 4)

            if luku2 == 1:
                hidastulostus("The bad men flew the plane into a building. You died.")
                # tähän pelin lopetus funktio!
            else:
                hidastulostus("The bad men kidnapped you and you rotted in a cell for 1 year.")
            break

        else:
            hidastulostus("Please enter only 1 or 2.")

# Call the function
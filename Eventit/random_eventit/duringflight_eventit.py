import sys
import time
import random


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

    # kysytään kunnes valinta on oikein
    while True:
        valinta = input("Anna numero (1-5): ")

        if valinta in ["1", "2", "3", "4", "5"]:
            break
        else:
            hidastulostus("Virheellinen valinta, yritä uudestaan!")


    if valinta == "1":
        hidastulostus("Valitsit pizzan ")
    elif valinta == "2":
        hidastulostus("Valitsit hampurilaisen ")
    elif valinta == "3":
        hidastulostus("Valitsit salaatin ")
    elif valinta == "4":
        hidastulostus("Valitsit pastan ")
    elif valinta == "5":
        hidastulostus("Vieruskaverisi ajattelee sinua köyhäksi ")





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



# Call the
def aliens_invade():
    hidastulostus("Aliens space ship starts to pull your plane towards it.")
    hidastulostus("The plane starts to shake and passengers are screaming!")
    hidastulostus("Plane and the ufo are flying side by side.  ")
    hidastulostus("The aliens starts to invade your plane")
    hidastulostus("Are you going to: ")
    hidastulostus("(1) ask help from the police that sits besides you")
    hidastulostus("(2) Try to communicate with the aliens")
    hidastulostus("(3) Rally the passengers to try and fight the aliens!")

    while True:
        vastaus3 = input("choose 1-3: ")
        if vastaus3 in ["1","2","3"]:
            break
        else:
            print("Please choose 1-3")

    if vastaus3 == "1":
        hidastulostus("The police suggests that he is going to shoot them, do you: ")
        hidastulostus("(1) Trust the police with the gun")
        hidastulostus("(2) Take the gun yourself")

        while True:
            vastaus3 = input("choose 1-2: ")
            if vastaus3 in ["1","2"]:
                break
            else:
                print("Please choose 1-2")

        if vastaus3 == "1":
            hidastulostus("The aliens come in to the plane and the police takes his shot")
            hidastulostus("He misses and the aliens take over")
            return

        elif vastaus3 == "2":
            hidastulostus("Your practises at the gun range finally pay off and your able top prevent the aliens from taking over the plane.")
            return


    elif vastaus3 == "2":
        hidastulostus("The aliens invade the plane and you start to communicate with them")
        hidastulostus("the aliens and yourself were confused about your different languages")
        hidastulostus("somehow besides your differences you commonly agreed to shake hands and go on with your day.")
        return

    elif vastaus3 == "3":
        hidastulostus("Your desperate attempt to fight the aliens fails after a long fight. you died.")
        return
def alien():
    noppa = random.randint(1,3)
    while True:
        if noppa == 1 :
            hidastulostus("An unidentified flying object flies past you. No one else saw it and your confused.")
            break
        elif noppa == 3:
            aliens_invade()
            break

        elif noppa == 2:
                hidastulostus("An unidentified flying object flies past you. You start to hear voices that say")
                hidastulostus('"Why are you occupying our airspace without permission"')
                hidastulostus("What is that voice in my head?!?!")
                hidastulostus('"We can hear your thoughts, answer us immediately"')
                hidastulostus("What will you do?")
                hidastulostus("(1) Threaten them")
                hidastulostus("(2) Ignore them")

                while True:
                    vastaus = input("Choose 1-2: ")
                    if vastaus in ["1","2"]:
                        break
                    else:
                        print("Please choose 1 or 2")

                if vastaus == "1":
                    aliens_invade()
                    break

                elif vastaus == "2":
                    hidastulostus('"answer us or we will exterminate you!"')
                    hidastulostus("(1) ignore them again")
                    hidastulostus("(2) Tell them that you didnt know about their airspace")

                    while True:
                        vastaus2 = input("Choose 1-2: ")
                        if vastaus2 in ["1","2"]:
                            break
                        else:
                            print("Please choose 1 or 2")

                    if vastaus2 == "1":
                        hidastulostus("the aliens got tired of your bullcrap and exterminated you")
                        break
                        #pelin lopetus funktio

                    elif vastaus2 == "2":
                        hidastulostus('"we didnt know your that stupid"')
                        break


tapahtumat = [stuertti, terrorist, alien]

def randomrandomiser():
    tapahtuma = random.choice(tapahtumat)
    tapahtuma()

def randomevent_d():
    luku = random.randint(1,50)
    if luku == 1:
        randomrandomiser()

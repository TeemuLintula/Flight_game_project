import random
import sys
import time


def hidastulostus(teksti, nopeus=0.03):
    for c in teksti + "\n":
        sys.stdout.write(c)
        sys.stdout.flush()
        time.sleep(nopeus)

def skinwalker():
    hidastulostus('"Someone starts to knock your door"\n')
    hidastulostus('You start walking towards the door.\n'
                  'You check through the peephole. You see a pale long man. Over 2 meters tall standing in front of the door.\n'
                  "You check the time. It's 03:13.\n"
                  'Pale man says:\n'
                  '"Can you open the door, I´m starving and it´s very cold over here."\n'
                  '"What will you do"')

    while True:
        skinari = input("(1) Let him in\n"
                        "(2) Question him\n"
                        "(3) Don't say anything\n"
                        "(Choose 1-3): ")

        if skinari == "1":
            hidastulostus("Pale man thanks you.\n"
                          "Everything seems fine, but just after the man enters he attacks you and you didn't have time to react...")
            return

        elif skinari == "2":
            hidastulostus("You ask the pale man:\n"
                          "Why are you all the way here at this time??\n"
                          "Pale man says:\n"
                          '"I´m starving and it´s very cold over here"\n'
                          'You say:\n'
                          '"Yeah yeah, you just said the same thing!"\n'
                          'After you get suspicious of the man, you: ')

            while True:
                skinari2 = input("(1) Say you can't let him in\n"
                                 "(2) Say he can enter\n"
                                 "(Choose 1 or 2): ")

                if skinari2 == "1":
                    hidastulostus("Pale man comes veeery close to the peephole. You start to get shivers because it seems like the man sees through the peephole.\n"
                                  "You hold your breath for a while... after 20 seconds the man walks away. You sigh for relief and go back to sleep")
                    return

                elif skinari2 == "2":
                    hidastulostus("Pale man thanks you.\n"
                                  "Everything seems fine, but just after the man enters he attacks you and you didn't have time to react...")
                    return

                else:
                    print("Please enter 1-2")

        elif skinari == "3":
            hidastulostus("Pale man comes veeery close to the peephole. You start to get shivers because it seems like the man sees through the peephole.\n"
                          "You hold your breath for a while... after 20 seconds the man walks away. You sigh for relief and go back to sleep.")
            return

        else:
            print("Please enter 1-3")




def naapuri():
    hidastulostus("Your neighbour Greg is knocking on your hangar door. ")

    while True:
        naapuri = input("Will you open the door? (yes/no): ")
        if naapuri.upper() == "YES":
            hidastulostus("Greg: Oh hello there!\n"
                 "I was just thinking, why it's smelling so weird in here?\n"
                 "Could you stop whatever produces these smells?")
            vastaus1 = input("Will you stop producing spices for Greg? (yes/no): ")
            if vastaus1.upper() == "YES":
                hidastulostus("Greg: Thank you so much for limiting your output of smells!\n(+1000 social credit)")
                break
            elif vastaus1.upper() == "NO":
                hidastulostus("Greg: Oh... this won't be the last time your hearing from me... ")
                break
        elif naapuri.upper() == "NO":
            hidastulostus('"Greg" is punching door 3 more times. After that he leaves.')
            break
        else:
            hidastulostus("Please enter yes or no")


def kysy_valinta(kysymys):
    while True:
        valinta = input(kysymys)
        if valinta in ["1", "2"]:
            return valinta
        else:
            hidastulostus("Virheellinen valinta. Syötä 1 tai 2.")


def liittymis_kysymys():
    liittyy = kysy_valinta("(1) En halua liittyä (2) Haluan liittyä: ")
    if liittyy == "1":
        hidastulostus("pala helvetissä pakana.")
    elif liittyy == "2":
        hidastulostus("Oikea valinta. Tässä vielä Vartiotorni-lehti, josta voit lukea meistä lisää.")


def jehovat():
    hidastulostus("Oveesi koputetaan ja näet ovisilmästä heidän olevan jehovantodistajia.")

    valinta = kysy_valinta("(1) Avaa ovi (2) Älä avaa ovea: ")

    if valinta == "1":
        hidastulostus("Olisiko teillä hetki aikaa puhua Jeesuksesta?")

        vastaus = kysy_valinta("(1) Ei (2) Kyllä: ")

        if vastaus == "1":
            hidastulostus("Ei kiinnosta. Kerron silti.")
            hidastulostus("Hyvä uutinen Jumalan valtakunnasta on tullut tietoomme, että sinäkin voit pelastua.")
            hidastulostus("Loppu on tulossa ja sinunkin on mahdollista pelastautua.")
            hidastulostus("Saatana tulee nousemaan maan päälle tuhoamaan kaikki. Jos liityt meihin sinullakin on mahdollisuus pelastua")

            liittymis_kysymys()

        elif vastaus == "2":
            hidastulostus("Hienoa!")
            hidastulostus("Hyvä uutinen Jumalan valtakunnasta on tullut tietoomme, että sinäkin voit pelastua.")
            hidastulostus("Loppu on tulossa ja sinunkin on mahdollista pelastautua.")
            hidastulostus("Saatana tulee nousemaan maan päälle tuhoamaan kaikki. Jos liityt meihin sinullakin on mahdollisuus pelastua.")

            liittymis_kysymys()

    elif valinta == "2":
        hidastulostus("Et avaa ovea ja koputus loppuu hetken kuluttua.")

tapahtumat = [jehovat, naapuri, skinwalker]



def randomrandomiser():
    tapahtuma = random.choice(tapahtumat)
    tapahtuma()

def randomevent_h():
    luku = random.randint(1,10)
    if luku == 1:
        randomrandomiser()

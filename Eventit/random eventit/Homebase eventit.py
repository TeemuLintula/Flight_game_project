import random
import sys
import time

def hidastulostus(teksti, nopeus=0.03):
    for c in teksti + "\n":
        sys.stdout.write(c)
        sys.stdout.flush()
        time.sleep(nopeus)
def karhuryhma():
    print("Your homebase is being investigated by karhuryhmä ")
    spice = random.randint(1,1000)
    print(f'Your homebase has {spice} kilograms of spices')
    if spice > 250:
        print("High chance of being held into custody")
    elif spice < 250:
        print("Low chance of being held into custody")
    return

def naapuri():
    print("Your neighbour Greg is knocking on your hangar door. ")

    while True:
        naapuri = input("Will you open the door? (yes/no)")
        if naapuri.upper() == "YES":
            print("Greg: Oh hello there!\n"
                 "I was just thinking, why it's smelling so weird in here?\n"
                 "Could you stop whatever produces these smells?")
            vastaus1 = input("Will you stop producing spices for Greg? (yes/no) ")
            if vastaus1.upper() == "YES":
                print("Greg: Thank you so much for limiting your output of smells!\n(+1000 social credit)")
                break
            elif vastaus1.upper() == "NO":
                print("Greg: Oh... this won't be the last time your hearing from me... ")
                break
        elif naapuri.upper() == "NO":
            print('"Greg" is punching door 3 more times. After that he leaves.')
            break
        else:
            print("Please enter yes or no")

naapuri()

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


jehovat()
import random
class tapahtuma:
    instances = []
    def __init__(self, id, text="", buttons=None):
        self.id = id
        self.text = text
        self.buttons = buttons
        tapahtuma.instances.append(self)


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

def co2limit_0(GameSetup):
    hidastulostus("Interpol starts to be suspicious about your business\n"
                  "They see your co2 emission and your money. \n"
                  "You are cooked........")
    GameSetup.endGame()

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
        hidastulostus("You wife got tired of you. She left you.")
    elif valinta == "4":
        hidastulostus("Your just a man you dont know anything about perfumes.")
        hidastulostus("Your wife hates the perfume but appreciated the thought.")

tapahtumat = [nainen, tulli]

def randomrandomiser(id):
    tapahtumat = [2, 8, 11]
    event = {}
    newid = int(id)
    if int(id) == 0:
        newid = random.choice(tapahtumat)
    for i in tapahtuma.instances:
        if i.id == newid:
            event = {
                "text": i.text,
                "buttons": i.buttons
            }
    print(event)
    return event
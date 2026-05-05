import random
class tapahtuma:
    instances = []
    def __init__(self, id, text="", buttons=None):
        self.id = id
        self.text = text
        self.buttons = buttons
        tapahtuma.instances.append(self)
#_________________STUERTTI EVENT_________________________________

stuertti = tapahtuma(2)
stuertti.text = "Flight attendant asks you what food you want!\n Choose what to eat!"
stuertti.buttons = [
    {
        "label" : "Pizza",
        "id" : 3
    },
    {
        "label" : "Hamburger",
        "id" : 4
    },
    {
        "label" : "Salad",
        "id" : 5
    },
{
        "label" : "Pasta",
        "id" : 6
    },
{
        "label" : "I'm not hungry",
        "id" : 7
    }
]

pizza = tapahtuma(3)
pizza.text = "You chose pizza!"
pizza.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
Hamburger = tapahtuma(4)
Hamburger.text ="You chose a hamburger!"
Hamburger.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
Salad = tapahtuma(5)
Salad.text ="You chose a salad!"
Salad.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
Pasta = tapahtuma(6)
Pasta.text ="You chose a pasta!"
Pasta.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
not_hungry = tapahtuma(7)
not_hungry.text = "A guy besides you thinks you're poor."
not_hungry.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
#---------------------TERRORIST EVENT__________________________
terrorist = tapahtuma(8)
terrorist.text = ("Bad men are trying to kidnap the plane!"
                  "\nAre you going to be a hero or look away and pray?")
terrorist.buttons = [
    {
        "label" : "Look away and pray",
        "id" : 9
    },
    {
        "label" : "Be a hero",
        "id" : 10
    }
]
Pray = tapahtuma(9)
Pray.text = ("Suddenly the bad men start to wave a white flag. They surrender because they become emphatic.")
Pray.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
Hero = tapahtuma(10)
Hero.text = ("You punched the bad men while they weren’t looking.\n"
             "You successfully prevented the kidnapping!")
Hero.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
#-------------------ALIEN EVENT--------------------------------------------------
Alien_mind = tapahtuma(11)
Alien_mind.text = ("An unidentified flying object flies past you. You start to hear voices that say\n"
                   "ALIENS: Why are you occupying our airspace without permission\n"
                "What is that voice in my head?!?!\n"
                   "ALIENS: We can hear your thoughts, answer us immediately")
Alien_mind.buttons = [
    {
        "label": "Threaten them",
        "id": 14
    },
    {
        "label": "Ignore them",
        "id": 13
    }
]
ignore = tapahtuma(13)
ignore.text = "ALIENS: Answer us or we will exterminate you!"
ignore.buttons = [
    {
        "label": "Ignore them again",
        "id": 18
    },
    {
        "label": "Tell them that you didnt know about their airspace",
        "id": 19
    }
]
ignore_again = tapahtuma(18)
ignore_again.text = "The aliens got tired of you and exterminated you"
ignore_again.buttons = [
    {
        "label" : "Continue",
        "id" : 67
    }
]
stupid = tapahtuma(19)
stupid.text = "ALIENS: Oh we didn't know your that stupid"
stupid.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]


#-------------------ALIEN INVADE EVENT------------------------------------------

Alien_invade = tapahtuma(14)
Alien_invade.text = ("Aliens space ship starts to pull your plane towards it.\n"
                     "The plane starts to shake and passengers are screaming!\n"
                     "Plane and the ufo are flying side by side.\n"
                     "The aliens starts to invade your plane Are you going to:")

Alien_invade.buttons = [
    {
        "label": "Ask help from the police that sits beside you",
        "id": 15
    },
    {
        "label": "Try to communicate with the aliens",
        "id": 16
    },
    {   "label": "Rally the passengers to try and fight the aliens",
        "id": 17
    } 
]
help = tapahtuma(15)
help.text = ("Police suggests that he is going to taser them.\n"
             "The aliens walk towards the police and they tasers the aliens. (W)")
help.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
communicate = tapahtuma(16)
communicate.text = ("The aliens invade the plane and you start to communicate with them\n"
                    "The aliens and yourself were confused about your different languages\n"
                    "Somehow besides your differences, you commonly agreed to shake hands and go on with your day.")
communicate.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]

rally = tapahtuma(17)
rally.text = ("Your desperate attempt to fight the aliens fails after a long fight.\n"
              "The aliens steal all the foods and drinks.\n"
              "After the fight, the aliens leave with peace")
rally.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
#-------------------INTERPOL JOS LIIKAA CO2 PÄÄSTÖJÄ-----------------------------
interpol = tapahtuma(22)
interpol.text = "Interpol became suspicious about your CO2 emission. They hunted you down by searching everywhere"
interpol.buttons = [
    {
        "label" : "Continue",
        "id" : 67
    }
]
#-------------------TAPAHTUMAT RANDOMIZATAAN TÄSSÄ_______________________________
# ID 0 = tulee uus random tapahtuma, ID 1 = tapahtuma loppuu


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
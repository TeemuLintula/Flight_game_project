import random
class tapahtuma:
    instances = []
    def __init__(self, id, text="", buttons=None):
        self.id = id
        self.text = text
        self.buttons = buttons
        tapahtuma.instances.append(self)

#------------------TULLI EVENTTI----------------------------
tulli = tapahtuma(2)
tulli.text = ("Customs are asking you to verify cargo\n"
              "Are you willing to show your cargo?")
tulli.buttons= [
    {
        "label" : "Yes",
        "id" : 3
    },
    {
        "label" : "No",
        "id" : 4
    }
]
tulli_yes = tapahtuma(3)
tulli_yes.text = ("Customs: (checking)\n"
                  "You're good to go! Have a nice day!")
tulli_yes.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
tulli_no = tapahtuma(4)
tulli_no.text = "Customs: We will let this slide for just this time..."
tulli_no.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]

#-------------------------NAINEN EVENTTI------------------------------
nainen = tapahtuma(5)
nainen.text = "Your wife said before you left, that you had better to bring me some presents.\n Are you going to:"
nainen.buttons = [
    {
        "label" : "Buy some shoes",
        "id" : 6
    },
    {
        "label" : "Buy something nice from a candy shop",
        "id" : 7
    },
    {
        "label" : "Buy some good perfume",
        "id" : 8
    },
{
        "label" : "Ignore your wife completely",
        "id" : 9
    }
]
shoes = tapahtuma(6)
shoes.text = "You bought yor wife a pair of shoes. She liked them yeezyys<3."
shoes.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
candy = tapahtuma(7)
candy.text = "You bought your wife a moomin candy box. She felt nostalgic."
candy.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
perfume = tapahtuma(8)
perfume.text = ("You are just a man and you dont know anything about perfumes.\n"
                "Your wife hates the perfume but appreciated the thought.")
perfume.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]
ignore_wife = tapahtuma(9)
ignore_wife.text = "Your wife got tired of you ignoring her 24/7. She left you."
ignore_wife.buttons = [
    {
        "label" : "Continue",
        "id" : 1
    }
]

def randomrandomiser(id):
    tapahtumat = [2, 5]
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